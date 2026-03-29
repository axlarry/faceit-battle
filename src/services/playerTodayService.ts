import { faceitApiClient } from './faceitApiClient';

export interface TodayStats {
  present: boolean;
  win: number;
  lose: number;
  count: number;
  elo: number;      // always 0 — FACEIT API doesn't expose per-match ELO
  elo_win: number;  // always 0
  elo_lose: number; // always 0
}

export interface PlayerTodayResult {
  today: TodayStats | null;
  isLive: boolean;
  liveMatchId?: string;
  report: string; // "WIN match, LOSE match, ..." — last 5 results for TrendIndicator
}

/** Convert ISO 3166-1 alpha-2 country code (e.g. "ro") to flag emoji (e.g. 🇷🇴) */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const offset = 127397; // codepoint offset for Regional Indicator symbols
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
}

function getPlayerTeam(match: any, playerId: string): string | null {
  for (const [teamId, team] of Object.entries(match.teams || {}) as [string, any][]) {
    if ((team.players || []).some((p: any) => p.player_id === playerId)) {
      return teamId;
    }
  }
  return null;
}

function isTodayUTC(timestampSec: number): boolean {
  const d = new Date(timestampSec * 1000);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

/**
 * Fetch last 20 matches for a player and compute:
 *  - today wins/losses
 *  - live status (most recent match still ongoing)
 *  - last-5 result trend string
 */
export async function getPlayerTodayData(playerId: string): Promise<PlayerTodayResult | null> {
  try {
    const data = await faceitApiClient.makeApiCall(
      `/players/${playerId}/history?game=cs2&limit=20`,
      false
    );
    const matches: any[] = data?.items || [];
    if (matches.length === 0) return { today: null, isLive: false, report: '' };

    const nowSec = Math.floor(Date.now() / 1000);

    // Live: latest match has no finished_at and started within the last 3 hours
    const latest = matches[0];
    const isLive =
      !!latest &&
      !latest.finished_at &&
      !!latest.started_at &&
      nowSec - latest.started_at < 10800;

    const completed = matches.filter((m: any) => !!m.finished_at);

    // Today's completed matches
    let wins = 0;
    let losses = 0;
    const todayMatches = completed.filter((m: any) => isTodayUTC(m.finished_at));
    for (const m of todayMatches) {
      const team = getPlayerTeam(m, playerId);
      if (team) {
        if (m.results?.winner === team) wins++;
        else losses++;
      }
    }

    // Report for TrendIndicator — "WIN match, LOSE match, ..."
    const last5 = completed.slice(0, 5);
    const report = last5
      .map((m: any) => {
        const team = getPlayerTeam(m, playerId);
        return m.results?.winner === team ? 'WIN match' : 'LOSE match';
      })
      .join(', ');

    return {
      today: {
        present: todayMatches.length > 0,
        win: wins,
        lose: losses,
        count: todayMatches.length,
        elo: 0,
        elo_win: 0,
        elo_lose: 0,
      },
      isLive,
      liveMatchId: isLive ? latest.match_id : undefined,
      report,
    };
  } catch (err) {
    console.warn(`playerTodayService error for ${playerId}:`, err);
    return null;
  }
}
