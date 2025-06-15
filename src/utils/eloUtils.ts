
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

// Store for ELO data from match history
let eloHistoryCache: { [matchId: string]: { elo_change: number } } = {};

export const setEloHistoryCache = (eloData: { [matchId: string]: { elo_change: number } }) => {
  eloHistoryCache = eloData;
  console.log('📁 Updated ELO history cache with data for matches:', Object.keys(eloData));
};

export const getEloChange = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
  const matchStatsData = matchesStats[match.match_id];
  
  if (!logMatchAnalysis(match, player, matchStatsData)) {
    return null;
  }
  
  // First check the history cache
  if (eloHistoryCache[match.match_id]) {
    console.log('✅ Found ELO change in history cache:', eloHistoryCache[match.match_id]);
    return eloHistoryCache[match.match_id];
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
