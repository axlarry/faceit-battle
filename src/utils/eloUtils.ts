
import { Player, Match } from "@/types/Player";
import { 
  searchDirectEloChange, 
  searchResultsSection, 
  searchTeamsStructure, 
  searchRoundsStructure, 
  searchOriginalMatch 
} from "./elo/eloSearchStrategies";
import { searchRecursiveEloData, searchEloInArrays } from "./elo/eloRecursiveSearch";
import { getEloFromMatchDetail } from "./elo/eloMatchDetailStrategy";

export const getEloChange = async (
  match: Match, 
  player: Player, 
  matchesStats: {[key: string]: any},
  getMatchDetails?: (matchId: string) => Promise<any>
) => {
  console.log(`[ELO] Starting ELO detection for match ${match.match_id} and player ${player.player_id}`);
  
  // PRIORITY 1: Try match details endpoint (most reliable) only if function is available
  if (getMatchDetails) {
    try {
      console.log(`[ELO] Trying match details strategy...`);
      const matchDetailResult = await getEloFromMatchDetail(match.match_id, player, getMatchDetails);
      if (matchDetailResult) {
        console.log(`[ELO] Match details strategy successful:`, matchDetailResult);
        return matchDetailResult;
      }
      console.log(`[ELO] Match details strategy returned null, trying other strategies...`);
    } catch (error) {
      console.error('[ELO] Error in match details strategy:', error);
      // Continue to other strategies instead of failing
    }
  } else {
    console.log(`[ELO] getMatchDetails function not available, skipping match details strategy`);
  }
  
  // PRIORITY 2: Execute search strategies on match stats data
  const matchStatsData = matchesStats[match.match_id];
  if (matchStatsData) {
    console.log(`[ELO] Trying alternative strategies with match stats data...`);
    const searchStrategies = [
      () => searchDirectEloChange(matchStatsData, player),
      () => searchResultsSection(matchStatsData, player),
      () => searchTeamsStructure(matchStatsData, player),
      () => searchRoundsStructure(matchStatsData, player),
      () => searchRecursiveEloData(matchStatsData, player),
      () => searchOriginalMatch(match, player),
      () => searchEloInArrays(matchStatsData, player)
    ];
    
    for (const strategy of searchStrategies) {
      try {
        const result = strategy();
        if (result) {
          console.log(`[ELO] Alternative strategy successful:`, result);
          return result;
        }
      } catch (error) {
        console.error('[ELO] Error in alternative strategy:', error);
        // Continue to next strategy
      }
    }
  } else {
    console.log(`[ELO] No match stats data available for match ${match.match_id}`);
  }
  
  console.log(`[ELO] All strategies failed for match ${match.match_id}`);
  return null;
};
