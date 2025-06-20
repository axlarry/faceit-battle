
import { useState } from 'react';
import { makeApiCall } from '@/services/faceitApiClient';
import { 
  checkPlayerLiveMatch, 
  getPlayerStats, 
  getPlayerMatches, 
  searchPlayer 
} from '@/services/faceitPlayerApi';
import { getMatchDetails, getMatchStats } from '@/services/faceitMatchApi';
import { getLeaderboard } from '@/services/faceitLeaderboardApi';

export const useFaceitApi = () => {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    makeApiCall,
    getPlayerStats,
    getPlayerMatches,
    getMatchDetails,
    getMatchStats,
    getLeaderboard,
    searchPlayer,
    checkPlayerLiveMatch
  };
};
