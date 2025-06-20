
import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/Player';
import { useFaceitApi } from './useFaceitApi';

interface LiveMatchData {
  isLive: boolean;
  matchData: any;
}

export const useLiveMatchChecker = (friends: Player[]) => {
  const [liveMatches, setLiveMatches] = useState<Map<string, LiveMatchData>>(new Map());
  const [isChecking, setIsChecking] = useState(false);
  const { checkPlayerLiveMatch } = useFaceitApi();

  const checkAllFriendsLiveStatus = useCallback(async () => {
    if (friends.length === 0 || isChecking) return;

    setIsChecking(true);
    console.log('Checking live status for all friends...');

    try {
      const promises = friends.map(async (friend) => {
        try {
          const liveData = await checkPlayerLiveMatch(friend.player_id);
          return { playerId: friend.player_id, liveData };
        } catch (error) {
          console.error(`Error checking live status for ${friend.nickname}:`, error);
          return { playerId: friend.player_id, liveData: { isLive: false, matchData: null } };
        }
      });

      const results = await Promise.all(promises);
      
      const newLiveMatches = new Map<string, LiveMatchData>();
      results.forEach(({ playerId, liveData }) => {
        newLiveMatches.set(playerId, liveData);
      });

      setLiveMatches(newLiveMatches);
      console.log('Live status check completed');
    } catch (error) {
      console.error('Error checking live status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [friends, checkPlayerLiveMatch, isChecking]);

  // Check live status every 30 seconds
  useEffect(() => {
    if (friends.length === 0) return;

    // Initial check
    checkAllFriendsLiveStatus();

    // Set up interval for periodic checks
    const interval = setInterval(checkAllFriendsLiveStatus, 30000);

    return () => clearInterval(interval);
  }, [friends, checkAllFriendsLiveStatus]);

  const isPlayerLive = useCallback((playerId: string): boolean => {
    return liveMatches.get(playerId)?.isLive || false;
  }, [liveMatches]);

  const getPlayerMatchData = useCallback((playerId: string): any => {
    return liveMatches.get(playerId)?.matchData || null;
  }, [liveMatches]);

  return {
    isPlayerLive,
    getPlayerMatchData,
    isChecking,
    checkAllFriendsLiveStatus
  };
};
