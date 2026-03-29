
import { Player, Match } from "@/types/Player";

export const getEloChange = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
  const matchStatsData = matchesStats[match.match_id];
  if (!matchStatsData) {
    return null;
  }

  // Helper function to search recursively for rank/ELO data
  const findPlayerRankData = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      const rankKeys = [
        'rank', 'ranking', 'skill_level', 'faceit_elo', 'elo', 'rating',
        'level_before', 'level_after', 'elo_before', 'elo_after',
        'rank_before', 'rank_after', 'skill_level_before', 'skill_level_after'
      ];

      if (rankKeys.includes(key.toLowerCase())) {
        if (Array.isArray(value)) {
          const playerRankData = value.find((item: any) =>
            item && item.player_id === player.player_id
          );
          if (playerRankData) {
            return playerRankData;
          }
        }

        if (value && typeof value === 'object' && 'player_id' in value) {
          if ((value as any).player_id === player.player_id) {
            return value;
          }
        }
      }

      if (value && typeof value === 'object' && 'player_id' in value) {
        if ((value as any).player_id === player.player_id) {
          const allRankProps = [
            'elo_change', 'ELO Change', 'Elo Change', 'rating_change', 'Rating Change',
            'elo_diff', 'elo_delta', 'faceit_elo_change', 'skill_level_change',
            'rank', 'ranking', 'skill_level', 'faceit_elo', 'elo', 'rating',
            'level_before', 'level_after', 'elo_before', 'elo_after',
            'rank_before', 'rank_after', 'skill_level_before', 'skill_level_after'
          ];

          for (const prop of allRankProps) {
            if ((value as any)[prop] !== undefined) {
              const rankValue = (value as any)[prop];

              if (typeof rankValue === 'number') {
                if (prop.toLowerCase().includes('change') || prop.toLowerCase().includes('diff') || prop.toLowerCase().includes('delta')) {
                  return { elo_change: rankValue };
                }
              } else if (typeof rankValue === 'string') {
                const parsedRank = parseInt(rankValue);
                if (!isNaN(parsedRank)) {
                  if (prop.toLowerCase().includes('change') || prop.toLowerCase().includes('diff') || prop.toLowerCase().includes('delta')) {
                    return { elo_change: parsedRank };
                  }
                }
              } else if (typeof rankValue === 'object' && rankValue !== null) {
                if ('after' in rankValue && 'before' in rankValue) {
                  const after = typeof rankValue.after === 'string' ? parseInt(rankValue.after) : rankValue.after;
                  const before = typeof rankValue.before === 'string' ? parseInt(rankValue.before) : rankValue.before;

                  if (typeof after === 'number' && typeof before === 'number') {
                    return { elo_change: after - before };
                  }
                }

                if ('change' in rankValue) {
                  const change = typeof rankValue.change === 'string' ? parseInt(rankValue.change) : rankValue.change;
                  if (typeof change === 'number') {
                    return { elo_change: change };
                  }
                }
              }
            }
          }

          for (const [nestedKey, nestedValue] of Object.entries(value as any)) {
            if (typeof nestedValue === 'object' && nestedValue !== null) {
              for (const prop of allRankProps) {
                if ((nestedValue as any)[prop] !== undefined) {
                  const rankValue = (nestedValue as any)[prop];
                  if (typeof rankValue === 'number' && (prop.toLowerCase().includes('change') || prop.toLowerCase().includes('diff'))) {
                    return { elo_change: rankValue };
                  }
                }
              }
            }
          }
        }
      }

      if (typeof value === 'object' && value !== null) {
        const result = findPlayerRankData(value, currentPath);
        if (result) return result;
      }
    }

    return null;
  };

  // Priority 1: Check rank-specific sections at root level
  const rankSections = ['rank_history', 'rank_changes', 'ranking', 'ranks', 'player_rankings'];
  for (const section of rankSections) {
    if (matchStatsData[section]) {
      if (Array.isArray(matchStatsData[section])) {
        const playerRankData = matchStatsData[section].find((item: any) =>
          item && item.player_id === player.player_id
        );
        if (playerRankData) {
          for (const key of Object.keys(playerRankData)) {
            if (key.toLowerCase().includes('change') || key.toLowerCase().includes('diff')) {
              const value = playerRankData[key];
              const numValue = typeof value === 'string' ? parseInt(value) : value;
              if (typeof numValue === 'number') {
                return { elo_change: numValue };
              }
            }
          }
        }
      }
    }
  }

  // Priority 2: Direct elo_change array at root level
  if (matchStatsData.elo_change && Array.isArray(matchStatsData.elo_change)) {
    const playerEloData = matchStatsData.elo_change.find((elo: any) =>
      elo.player_id === player.player_id
    );
    if (playerEloData && typeof playerEloData.elo_change === 'number') {
      return { elo_change: playerEloData.elo_change };
    }
  }

  // Priority 3: Check in results for rank data
  if (matchStatsData.results) {
    const rankResult = findPlayerRankData(matchStatsData.results, 'results');
    if (rankResult) return rankResult;
  }

  // Priority 4: Comprehensive recursive search
  const recursiveResult = findPlayerRankData(matchStatsData);
  if (recursiveResult) {
    return recursiveResult;
  }

  // Priority 5: Check match.teams data from the original match object
  if (match.teams) {
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData) {
        const rankResult = findPlayerRankData(playerData, 'match.teams');
        if (rankResult) return rankResult;
      }
    }
  }

  return null;
};
