import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction, isDiscordActivity } from "@/lib/discordProxy";

export interface AnalyserTodayStats {
  present: boolean;
  win: number;
  lose: number;
  count: number;
  elo: number; // net ELO today
  elo_win: number; // total ELO won today
  elo_lose: number; // total ELO lost today
}

export interface AnalyserMatch {
  matchId: string;
  date: string;
  map: string;
  elo: number;
  eloDelta: number;
  eloDeltaStr: string;
  result: "WIN" | "LOSE";
  k: number;
  a: number;
  d: number;
  kdr: number;
  hltv: number;
  isToday: boolean;
}

/**
 * Parse elo_delta string from FaceitAnalyser to a number.
 * Formats: "23", "-23", "+23", "(+23)", "(-23)"
 */
function parseEloDelta(delta: string | number | undefined): number {
  if (delta == null) return 0;
  if (typeof delta === "number") return delta;

  const cleaned = delta.toString().replace(/[()]/g, "").replace(/\+/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (
  functionName: string,
  body: Record<string, unknown>,
) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

/**
 * Fetch matches from FaceitAnalyser and compute today's ELO stats.
 * Uses the `matches` endpoint which returns per-match elo_delta.
 */
export async function getAnalyserTodayData(
  nickname: string,
  playerId?: string,
): Promise<{
  today: AnalyserTodayStats | null;
  matches: AnalyserMatch[];
  isLive: boolean;
  report: string;
} | null> {
  try {
    console.log(`[AnalyserToday] Fetching matches for ${nickname}...`);

    // Fetch matches from FaceitAnalyser (returns segments with elo_delta)
    const { data: matchesData, error } = await invokeFunction(
      "get-faceit-analyser-data",
      {
        nickname,
        endpoint: "matches",
      },
    );

    console.log(
      `[AnalyserToday] Response for ${nickname}: error=${error}, hasSegments=${!!(matchesData as any)?.segments}`,
    );

    if (error) {
      console.warn(
        `[AnalyserToday] Edge function error for ${nickname}:`,
        error,
      );
      return null;
    }

    if ((matchesData as any)?.error) {
      console.warn(
        `[AnalyserToday] API error for ${nickname}:`,
        (matchesData as any).error,
      );
      return null;
    }

    if (!matchesData || !matchesData.segments) {
      console.warn(`[AnalyserToday] No matches data for ${nickname}`);
      return null;
    }

    const segments = matchesData.segments as any[];
    if (segments.length === 0) {
      return {
        today: null,
        matches: [],
        isLive: false,
        report: "",
      };
    }

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Parse all matches
    const allMatches: AnalyserMatch[] = segments.map((seg: any) => {
      const eloDelta = parseEloDelta(seg.elo_delta);
      const isWin = eloDelta > 0;

      return {
        matchId: seg.matchId || seg.mid || "",
        date: seg.date || "",
        map: seg.map || "Unknown",
        elo: seg.elo || 0,
        eloDelta,
        eloDeltaStr: seg.elod || String(eloDelta),
        result: isWin ? "WIN" : "LOSE",
        k: seg.k || 0,
        a: seg.a || 0,
        d: seg.d || 0,
        kdr: seg.kdr || 0,
        hltv: seg.hltv || 0,
        isToday: seg.date === todayStr,
      };
    });

    // Check if latest match is still live
    const latest = segments[0];
    const nowSec = Math.floor(Date.now() / 1000);
    const startedAt = latest.started_at || 0;
    const isLive =
      !latest.finished_at && startedAt > 0 && nowSec - startedAt < 10800;

    // Filter today's completed matches
    const todayMatches = allMatches.filter((m) => m.isToday);
    const completedToday = todayMatches.filter((m) => m.eloDelta !== 0); // skip unplayed

    // Calculate ELO stats
    let eloWin = 0;
    let eloLose = 0;

    for (const m of completedToday) {
      if (m.eloDelta > 0) eloWin += m.eloDelta;
      else eloLose += Math.abs(m.eloDelta);
    }

    const totalElo = eloWin - eloLose;

    // Build report string for TrendIndicator (last 5 results)
    const last5 = allMatches.slice(0, 5);
    const report = last5
      .map((m) => `${m.result} ${m.map} (${m.eloDeltaStr})`)
      .join(", ");

    return {
      today:
        completedToday.length > 0
          ? {
              present: true,
              win: completedToday.filter((m) => m.eloDelta > 0).length,
              lose: completedToday.filter((m) => m.eloDelta < 0).length,
              count: completedToday.length,
              elo: totalElo,
              elo_win: eloWin,
              elo_lose: eloLose,
            }
          : {
              present: false,
              win: 0,
              lose: 0,
              count: 0,
              elo: 0,
              elo_win: 0,
              elo_lose: 0,
            },
      matches: allMatches,
      isLive,
      report,
    };
  } catch (error) {
    console.warn(`[AnalyserToday] Error for ${nickname}:`, error);
    return null;
  }
}
