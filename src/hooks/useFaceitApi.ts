
import { useState } from 'react';
import { faceitAnalyserApiClient } from '@/services/faceitAnalyserApiClient';
import { playerService } from '@/services/playerService';
import { matchService } from '@/services/matchService';
import { leaderboardService } from '@/services/leaderboardService';

export const useFaceitApi = () => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    makeApiCall: faceitAnalyserApiClient.makeApiCall.bind(faceitAnalyserApiClient),
    getPlayerStats: playerService.getPlayerStats.bind(playerService),
    getPlayerMatches: playerService.getPlayerMatches.bind(playerService),
    getMatchDetails: matchService.getMatchDetails.bind(matchService),
    getMatchStats: matchService.getMatchStats.bind(matchService),
    getLeaderboard: leaderboardService.getLeaderboard.bind(leaderboardService),
    searchPlayer: playerService.searchPlayer.bind(playerService),
    checkPlayerLiveMatch: playerService.checkPlayerLiveMatch.bind(playerService),
    // FaceitAnalyser specific methods
    getPlayerOverview: faceitAnalyserApiClient.getPlayerOverview.bind(faceitAnalyserApiClient),
    getPlayerMaps: faceitAnalyserApiClient.getPlayerMaps.bind(faceitAnalyserApiClient),
    getPlayerHubs: faceitAnalyserApiClient.getPlayerHubs.bind(faceitAnalyserApiClient),
    getPlayerHighlights: faceitAnalyserApiClient.getPlayerHighlights.bind(faceitAnalyserApiClient),
    getPlayerGraphs: faceitAnalyserApiClient.getPlayerGraphs.bind(faceitAnalyserApiClient)
  };
};
