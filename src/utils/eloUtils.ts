
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
import { getEloFromMatchDetail } from "./elo/eloMatchDetailStrategy";

export const getEloChange = async (
  match: Match, 
  player: Player, 
  matchesStats: {[key: string]: any},
  getMatchDetails?: (matchId: string) => Promise<any>
) => {
  const matchStatsData = matchesStats[match.match_id];
  
  if (!logMatchAnalysis(match, player, matchStatsData)) {
    return null;
  }
  
  // PRIORITY 1: Try match details endpoint (most reliable)
  if (getMatchDetails) {
    console.log('🎯 PRIORITY 1: Trying match details endpoint...');
    const matchDetailResult = await getEloFromMatchDetail(match.match_id, player, getMatchDetails);
    if (matchDetailResult) {
      console.log('✅ ELO found via match details endpoint:', matchDetailResult);
      return matchDetailResult;
    }
  }
  
  // PRIORITY 2: Execute other search strategies on match stats data
  console.log('🔍 Trying fallback search strategies on match stats...');
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
