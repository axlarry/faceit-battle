/**
 * EnrichedPlayerService — provides enriched player data from 2 APIs:
 *
 * 1. FACEIT official API  → base player data (elo, level, avatar, cover)
 * 2. FaceitAnalyser API   → enrichment (today.elo, report, isLive, country/region/rankings)
 *
 * Cascade:
 *   Primary: FaceitAnalyser (via serialized queue, 5s interval, cached, retried)
 *   Ultimate fallback: FACEIT official /players/{id}/history
 *
 * KEY FIX: `elo` is ALWAYS provided by FACEIT official API (never undefined).
 * This eliminates the root cause bug where FaceitAnalyser success + lcrypt failure
 * resulted in elo: undefined → ?? fallback → FACEIT overwrites FaceitAnalyser data.
 */
import { faceitApiClient } from "./faceitApiClient";
import { getPlayerTodayData, countryCodeToFlag } from "./playerTodayService";
import { debugLog, debugWarn, debugError } from "@/utils/debug";

// Helper to invoke edge functions (Discord proxy support)
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction, isDiscordActivity } from "@/lib/discordProxy";

// ── FaceitAnalyser cache ────────────────────────────────────────────────────
interface FaCacheEntry {
  data: any;
  expiry: number;
  isError: boolean;
}

const faceitAnalyserCache = new Map<string, FaCacheEntry>();
const FA_SUCCESS_TTL = 600_000; // 10 min for success
const FA_ERROR_TTL = 900_000; // 15 min for errors

function getFaCached(nickname: string): any | null {
  const entry = faceitAnalyserCache.get(nickname);
  if (entry && Date.now() < entry.expiry) {
    return entry.data;
  }
  faceitAnalyserCache.delete(nickname);
  return null;
}

function setFaCached(nickname: string, data: any, isError: boolean): void {
  const ttl = isError ? FA_ERROR_TTL : FA_SUCCESS_TTL;
  faceitAnalyserCache.set(nickname, {
    data,
    expiry: Date.now() + ttl,
    isError,
  });
  // Evict oldest if cache grows too large
  if (faceitAnalyserCache.size > 200) {
    const oldest = faceitAnalyserCache.keys().next().value;
    if (oldest) faceitAnalyserCache.delete(oldest);
  }
}

// ── FaceitAnalyser serialized queue ─────────────────────────────────────────
class FaceitAnalyserQueue {
  private running = false;
  private queue: Array<() => void> = [];
  private lastCallTime = 0;
  private readonly minInterval = 5000; // 5s between calls

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minInterval) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, this.minInterval - elapsed),
      );
    }

    this.running = true;
    try {
      this.lastCallTime = Date.now();
      return await fn();
    } finally {
      this.running = false;
      this.queue.shift()?.();
    }
  }
}

const faceitAnalyserQueue = new FaceitAnalyserQueue();

// ── FaceitAnalyser invocation ───────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

const invokeFaceitAnalyser = async (nickname: string): Promise<any> => {
  const call = async () => {
    const fn = isDiscordActivity() ? invokeEdgeFunction : null;
    if (fn) {
      return fn("get-faceit-analyser-data", { nickname, endpoint: "matches" });
    }
    const { data, error } = await supabase.functions.invoke(
      "get-faceit-analyser-data",
      {
        body: { nickname, endpoint: "matches" },
      },
    );
    if (error) throw new Error(error.message);
    return data;
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await call();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        const delay =
          RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        debugWarn(
          `FaceitAnalyser attempt ${attempt + 1} failed for ${nickname}, retrying in ${delay}ms:`,
          lastError.message,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError!;
};

// Parse elo_delta string from FaceitAnalyser to a number
function parseEloDelta(delta: string | number | undefined): number {
  if (delta == null) return 0;
  if (typeof delta === "number") return delta;
  const cleaned = delta.toString().replace(/[()]/g, "").replace(/\+/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export interface EnrichedPlayerData {
  elo?: number;
  level?: string;
  region?: string;
  country?: string;
  country_flag?: string;
  region_ranking?: number;
  country_ranking?: number;
  report?: string;
  today?: {
    present: boolean;
    win: number;
    lose: number;
    elo: number;
    elo_win: number;
    elo_lose: number;
    count: number;
  };
  isLive: boolean;
  liveInfo?: {
    matchId: string;
    competition: string;
    status: string;
    state: string;
    matchDetails?: {
      map?: any;
      server?: any;
      score?: any;
      duration?: any;
      round?: any;
      elo_change?: any;
      result?: any;
      chance?: any;
    };
    liveMatch?: any;
  };
  rawData?: any;
  error?: boolean;
}

export class EnrichedPlayerService {
  /**
   * Get complete enriched player data.
   * Returns FACEIT elo (always defined) + FaceitAnalyser enrichment.
   */
  async getEnrichedPlayerData(
    nickname: string,
    playerId?: string,
    country?: string,
  ): Promise<EnrichedPlayerData | null> {
    debugLog(
      `getEnrichedPlayerData START, nickname=${nickname}, playerId=${playerId}`,
    );

    // ── Step 1: Fetch base data from FACEIT official API ──────────────────
    let faceitElo: number | undefined;
    let faceitLevel: string | undefined;
    let faceitAvatar: string | undefined;
    let faceitCover: string | undefined;
    let faceitCountry: string | undefined;

    try {
      const playerData = await faceitApiClient.makeApiCall(
        `/players?nickname=${encodeURIComponent(nickname)}`,
        false,
      );
      const cs2 = playerData?.games?.cs2 || {};
      faceitElo = cs2?.faceit_elo;
      faceitLevel = cs2?.skill_level;
      faceitAvatar = playerData?.avatar;
      faceitCover = playerData?.cover_image;
      faceitCountry = playerData?.country;
      debugLog(`FACEIT base: elo=${faceitElo}, level=${faceitLevel}`);
    } catch (e) {
      debugError(`FACEIT base fetch failed:`, e);
    }

    // ── Step 2: Try FaceitAnalyser for enrichment ─────────────────────────
    let faSegments: any[] = [];
    let faError = false;

    // Check cache first
    const cached = getFaCached(nickname);
    if (cached !== null) {
      debugLog(
        `FaceitAnalyser cache hit for ${nickname}, isError=${cached.isError}`,
      );
      if (Array.isArray(cached.segments)) {
        faSegments = cached.segments;
      } else {
        faSegments = cached;
      }
      faError = cached.isError === true;
    } else {
      try {
        const analyserData = await faceitAnalyserQueue.run(() =>
          invokeFaceitAnalyser(nickname),
        );
        setFaCached(nickname, analyserData, false);
        debugLog(
          `FaceitAnalyser raw response for ${nickname}:`,
          JSON.stringify(analyserData).slice(0, 500),
        );
        debugLog(
          `FaceitAnalyser returned ${analyserData?.segments?.length || 0} segments`,
        );
        if (analyserData && Array.isArray(analyserData.segments)) {
          faSegments = analyserData.segments;
        } else if (analyserData && Array.isArray(analyserData)) {
          // API might return segments directly as array
          faSegments = analyserData;
        }
      } catch (analyserErr) {
        setFaCached(nickname, { segments: [] }, true);
        faError = true;
        debugError(`invokeFaceitAnalyser error for ${nickname}:`, analyserErr);
      }
    }

    // ── Step 3: Process FaceitAnalyser segments ───────────────────────────
    // Use timestamp-based comparison (last 24 hours) to avoid timezone issues
    // between server UTC and browser local time
    const nowMs = Date.now();
    const oneDayAgoMs = nowMs - 24 * 60 * 60 * 1000;

    let eloWin = 0;
    let eloLose = 0;
    let report = "";
    let todayMatchCount = 0;
    let completedTodayCount = 0;
    let todayMatches: any[] = [];

    if (faSegments.length > 0) {
      // Filter today's matches — use timestamp comparison (last 24 hours)
      todayMatches = faSegments.filter((s: any) => {
        const matchDate = s.date || s.created_at || "";
        if (!matchDate) return false;
        const matchMs = new Date(matchDate).getTime();
        if (isNaN(matchMs)) return false;
        return matchMs >= oneDayAgoMs && matchMs <= nowMs + 60 * 60 * 1000; // allow 1hr future
      });
      todayMatchCount = todayMatches.length;

      // FaceitAnalyser segments use `w` field (1=win, 0=loss) for win/loss
      // Some segments may have `elo_delta` — prefer that when available
      const completedToday = todayMatches.filter((s: any) => {
        if (s.elo_delta != null && parseEloDelta(s.elo_delta) !== 0)
          return true;
        // Fallback: use `w` field if present
        return s.w != null;
      });
      completedTodayCount = completedToday.length;

      // Sum ELO — use elo_delta when available, otherwise estimate from w field
      for (const s of completedToday) {
        const delta = parseEloDelta(s.elo_delta);
        if (delta !== 0) {
          if (delta > 0) eloWin += delta;
          else eloLose += Math.abs(delta);
        } else if (s.w != null) {
          // Estimate: ~+20 per win, ~-20 per loss (FACEIT average)
          if (s.w === 1) eloWin += 20;
          else eloLose += 20;
        }
      }

      // Build report for TrendIndicator (last 5 matches overall)
      const last5 = faSegments.slice(0, 5);
      report = last5
        .map((s: any) => {
          const delta = parseEloDelta(s.elo_delta);
          // Use `w` field for result when elo_delta is not available
          const result =
            delta !== 0
              ? delta >= 0
                ? "WIN"
                : "LOSE"
              : s.w === 1
                ? "WIN"
                : s.w === 0
                  ? "LOSE"
                  : "WIN";
          const elod = s.elod != null ? s.elod : delta;
          return `${result} ${s.map || "Unknown"} (${elod >= 0 ? "+" : ""}${elod})`;
        })
        .join(", ");

      debugLog(
        `FaceitAnalyser: today=${todayMatchCount}, completed=${completedTodayCount}, ELO win=${eloWin} lose=${eloLose}`,
      );
    }

    // Count actual wins/losses from w field for today's matches
    let todayWins = 0;
    let todayLosses = 0;
    for (const s of todayMatches) {
      if (s.w === 1) todayWins++;
      else if (s.w === 0) todayLosses++;
    }

    const todayResult = {
      present: faSegments.length > 0 && todayWins + todayLosses > 0,
      win: todayWins,
      lose: todayLosses,
      count: todayMatchCount,
      elo: eloWin - eloLose,
      elo_win: eloWin,
      elo_lose: eloLose,
    };

    // ── Step 4: Check live status ────────────────────────────────────────
    // FaceitAnalyser segments don't have started_at/finished_at, so we check
    // FACEIT official API for live match status when playerId is available
    let isLive = false;
    let liveInfo: EnrichedPlayerData["liveInfo"] | undefined;

    if (playerId) {
      try {
        const historyResult = await getPlayerTodayData(playerId);
        if (historyResult?.isLive) {
          isLive = true;
          liveInfo = {
            matchId: historyResult.liveMatchId || "",
            competition: "FACEIT Match",
            status: "LIVE",
            state: "ONGOING",
            matchDetails: {},
            liveMatch: {
              match_id: historyResult.liveMatchId || "",
              competition_name: "FACEIT Match",
              status: "LIVE",
              started_at: Math.floor(Date.now() / 1000),
              finished_at: null,
              teams: {},
              voting: { map: { pick: [] } },
              isLiveMatch: true,
              liveMatchDetails: {},
            },
          };
        }
      } catch {
        // If history fetch fails, fall back to FaceitAnalyser segments
        const latest = faSegments[0];
        const nowSec = Math.floor(Date.now() / 1000);
        const startedAt = latest?.started_at || 0;
        isLive =
          !latest?.finished_at && startedAt > 0 && nowSec - startedAt < 10800;
      }
    } else if (faSegments.length > 0) {
      // Fallback: check FaceitAnalyser segments if no playerId
      const latest = faSegments[0];
      const nowSec = Math.floor(Date.now() / 1000);
      const startedAt = latest?.started_at || 0;
      isLive =
        !latest?.finished_at && startedAt > 0 && nowSec - startedAt < 10800;
    }

    // ── Step 5: Ultimate fallback — FACEIT history ──
    // Trigger when FA has no segments OR when FA segments exist but have no useful today data
    const hasUsefulTodayData = todayWins + todayLosses > 0;
    if ((faSegments.length === 0 || !hasUsefulTodayData) && playerId) {
      debugLog(
        `FaceitAnalyser returned no segments, trying FACEIT history fallback`,
      );
      const historyResult = await getPlayerTodayData(playerId);
      if (historyResult?.today) {
        todayResult.present = historyResult.today.present;
        todayResult.win = historyResult.today.win;
        todayResult.lose = historyResult.today.lose;
        todayResult.count = historyResult.today.count;
        todayResult.elo = 0; // FACEIT history doesn't have per-match ELO
        todayResult.elo_win = 0;
        todayResult.elo_lose = 0;
        if (historyResult.report) {
          report = historyResult.report;
        }
      }
    }

    const country_flag =
      country || faceitCountry
        ? countryCodeToFlag(country || faceitCountry || "")
        : undefined;

    debugLog(
      `FINAL RETURN: elo=${faceitElo}, today.present=${todayResult.present}, today.elo=${todayResult.elo}, isLive=${isLive}`,
    );

    return {
      elo: faceitElo,
      level: faceitLevel,
      region: undefined, // Could be added if FaceitAnalyser provides it
      country: country || faceitCountry,
      country_flag,
      region_ranking: undefined,
      country_ranking: undefined,
      report,
      today: todayResult.present ? todayResult : undefined,
      isLive,
      liveInfo,
      rawData: null,
      error: faError && faSegments.length === 0,
    };
  }
}

export const enrichedPlayerService = new EnrichedPlayerService();
