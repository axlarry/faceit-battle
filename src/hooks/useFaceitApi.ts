
import { useState } from 'react';
import { faceitApiClient } from '@/services/faceitApiClient';
import { playerService } from '@/services/playerService';
import { matchService } from '@/services/matchService';
import { leaderboardService } from '@/services/leaderboardService';

export const useFaceitApi = () => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    makeApiCall: faceitApiClient.makeApiCall.bind(faceitApiClient),
    getPlayerStats: playerService.getPlayerStats.bind(playerService),
    getPlayerMatches: playerService.getPlayerMatches.bind(playerService),
    getMatchDetails: matchService.getMatchDetails.bind(matchService),
    getMatchStats: matchService.getMatchStats.bind(matchService),
    getLeaderboard: leaderboardService.getLeaderboard.bind(leaderboardService),
    searchPlayer: playerService.searchPlayer.bind(playerService),
    checkPlayerLiveMatch: playerService.checkPlayerLiveMatch.bind(playerService)
  };
};
