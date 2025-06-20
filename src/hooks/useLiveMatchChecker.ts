
import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/Player';
import { useFaceitApi } from './useFaceitApi';

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
}

export const useLiveMatchChecker = (friends: Player[]) => {
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [isChecking, setIsChecking] = useState(false);
  const { checkPlayerLiveMatch } = useFaceitApi();
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkAllFriendsLiveMatches = async () => {
    if (friends.length === 0 || isChecking) return;
    
    setIsChecking(true);
    console.log('Checking live matches for all friends...');
    
    try {
      const liveMatchPromises = friends.map(async (friend) => {
        const liveInfo = await checkPlayerLiveMatch(friend.player_id);
        return { playerId: friend.player_id, liveInfo };
      });

      const results = await Promise.all(liveMatchPromises);
      
      const newLiveMatches: Record<string, LiveMatchInfo> = {};
      results.forEach(({ playerId, liveInfo }) => {
        newLiveMatches[playerId] = liveInfo;
      });
      
      setLiveMatches(newLiveMatches);
      console.log('Live matches updated:', newLiveMatches);
    } catch (error) {
      console.error('Error checking live matches:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verifică la început și apoi la fiecare 4 minute
  useEffect(() => {
    if (friends.length > 0) {
      checkAllFriendsLiveMatches();
      
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 240000); // 4 minute (240000ms)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [friends]);

  // Cleanup la unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    liveMatches,
    isChecking,
    checkAllFriendsLiveMatches
  };
};
