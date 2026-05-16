export interface MatchReportEntry {
  result: "WIN" | "LOSE";
  score: string;
  map: string;
  eloChange: number;
}

/**
 * Parse a match report string into structured match entries.
 * Supports formats:
 *   "WIN 13:10 Mirage (+30), LOSE 13:3 Dust II (-14)"
 *   "WIN Mirage +30, LOSE Dust II -14"
 *   "WIN Mirage (+30), LOSE Dust II (-14)"
 */
export const parseMatchReport = (report: string): MatchReportEntry[] => {
  if (!report || typeof report !== "string") return [];

  const parts = report.split(", ");
  const result: MatchReportEntry[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Try full format with score: "WIN 13:10 Mirage (+30)" or "WIN 13:10 Mirage +30" or "WIN 13:10 Mirage 30"
    const fullMatch = trimmed.match(
      /^(WIN|LOSE)\s+(\d+[:\-]\d+)\s+(.+?)\s+\(?([+-]?\d+)\)?$/,
    );
    if (fullMatch) {
      let eloChange = parseInt(fullMatch[4], 10);
      // Infer negative for LOSE when no explicit sign
      if (fullMatch[1] === "LOSE" && eloChange > 0) eloChange = -eloChange;
      result.push({
        result: fullMatch[1] as "WIN" | "LOSE",
        score: fullMatch[2],
        map: fullMatch[3].trim(),
        eloChange,
      });
      continue;
    }

    // Fallback: no score, just "WIN MapName +30" or "WIN MapName 30"
    const noScoreMatch = trimmed.match(
      /^(WIN|LOSE)\s+(.+?)\s+\(?([+-]?\d+)\)?$/,
    );
    if (noScoreMatch) {
      let eloChange = parseInt(noScoreMatch[3], 10);
      if (noScoreMatch[1] === "LOSE" && eloChange > 0) eloChange = -eloChange;
      result.push({
        result: noScoreMatch[1] as "WIN" | "LOSE",
        score: "",
        map: noScoreMatch[2].trim(),
        eloChange,
      });
    }
  }

  return result;
};

/**
 * Find the ELO change for a specific match from a parsed report.
 * Tries index-based matching first, then falls back to result-type matching.
 */
export const findMatchEloChangeFromReport = (
  match: any,
  reportEntries: MatchReportEntry[],
  matchIndex: number,
  player: any,
): number | null => {
  // Try to match by index first (most recent matches should be in order)
  if (reportEntries[matchIndex]) {
    return reportEntries[matchIndex].eloChange;
  }

  // Fallback: try to match by result type using proper match result logic
  if (match.teams && match.results && player) {
    // Find which team the player is on
    let playerTeamId = "";
    const teamIds = Object.keys(match.teams);

    for (const teamId of teamIds) {
      const team = match.teams[teamId];
      if (team.players?.some((p: any) => p.player_id === player.player_id)) {
        playerTeamId = teamId;
        break;
      }
    }

    if (playerTeamId) {
      const winnerTeamId = match.results.winner;
      const isWin = playerTeamId === winnerTeamId;
      const resultType = isWin ? "WIN" : "LOSE";

      const matchingEntry = reportEntries.find(
        (entry) => entry.result === resultType,
      );

      if (matchingEntry) {
        return matchingEntry.eloChange;
      }
    }
  }

  return null;
};
