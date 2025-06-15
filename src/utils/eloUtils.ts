
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
  const matchStatsData = matchesStats[match.match_id];
  
  // PRIORITY 1: Try match details endpoint (most reliable) only if function is available
  if (getMatchDetails) {
    try {
      const matchDetailResult = await getEloFromMatchDetail(match.match_id, player, getMatchDetails);
      if (matchDetailResult) {
        return matchDetailResult;
      }
    } catch (error) {
      console.error('Error fetching match details for ELO:', error);
      // Continue to other strategies instead of failing
    }
  }
  
  // PRIORITY 2: Execute search strategies on match stats data
  if (matchStatsData) {
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
          return result;
        }
      } catch (error) {
        console.error('Error in ELO search strategy:', error);
        // Continue to next strategy
      }
    }
  }
  
  return null;
};
