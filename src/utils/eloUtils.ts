
import { Player, Match } from "@/types/Player";
import { 
  searchDirectEloChange, 
  searchResultsSection, 
  searchTeamsStructure, 
  searchRoundsStructure, 
  searchOriginalMatch 
} from "./elo/eloSearchStrategies";
import { searchRecursiveEloData, searchEloInArrays } from "./elo/eloRecursiveSearch";
import { logMatchAnalysis, logAnalysisEnd } from "./elo/eloDataAnalyzer";

export const getEloChange = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
  const matchStatsData = matchesStats[match.match_id];
  
  if (!logMatchAnalysis(match, player, matchStatsData)) {
    return null;
  }
  
  // Execute search strategies in priority order
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
  
  // No ELO data found after all strategies
  logAnalysisEnd(matchStatsData);
  return null;
};
