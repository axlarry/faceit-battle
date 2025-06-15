
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
  
  if (!matchStatsData && !getMatchDetails) {
    return null;
  }
  
  // PRIORITY 1: Try match details endpoint (most reliable)
  if (getMatchDetails) {
    const matchDetailResult = await getEloFromMatchDetail(match.match_id, player, getMatchDetails);
    if (matchDetailResult) {
      return matchDetailResult;
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
      const result = strategy();
      if (result) {
        return result;
      }
    }
  }
  
  return null;
};
