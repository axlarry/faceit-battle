
import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/Player';
import { useFaceitApi } from './useFaceitApi';

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  status?: string;
  state?: string;
  matchDetails?: any;
  liveMatch?: any;
}

export const useLiveMatchChecker = (friends: Player[]) => {
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState<Set<string>>(new Set());
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const { checkPlayerLiveMatch } = useFaceitApi();
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkAllFriendsLiveMatches = async () => {
    if (friends.length === 0 || isChecking) return;
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    
    // Check every 90 seconds for live matches
    if (timeSinceLastCheck < 90000) {
      console.log(`⏱️ Skipping live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting LIVE matches check for ${friends.length} friends (90s interval)...`);
    
    try {
      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      let processedCount = 0;
      
      for (const friend of friends) {
        try {
          // Set loading state for current player
          setLoadingPlayers(prev => new Set([...prev, friend.player_id]));
          
          console.log(`🎯 Checking live status for: ${friend.nickname} (${friend.player_id})`);
          const liveInfo = await checkPlayerLiveMatch(friend.player_id);
          
          newLiveMatches[friend.player_id] = liveInfo;
          processedCount++;
          
          if (liveInfo.isLive) {
            console.log(`🟢 LIVE PLAYER DETECTED: ${friend.nickname} in ${liveInfo.competition} (${liveInfo.status})`);
          } else {
            console.log(`⚪ ${friend.nickname} is not live`);
          }
          
          // Remove loading state for current player
          setLoadingPlayers(prev => {
            const newSet = new Set(prev);
            newSet.delete(friend.player_id);
            return newSet;
          });
          
          // 2 second delay between API calls
          if (processedCount < friends.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error in live check for ${friend.nickname}:`, error);
          newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
          
          // Remove loading state even on error
          setLoadingPlayers(prev => {
            const newSet = new Set(prev);
            newSet.delete(friend.player_id);
            return newSet;
          });
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const liveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`✅ LIVE matches check completed: ${liveCount}/${friends.length} friends are live`);
      
    } catch (error) {
      console.warn('⚠️ Live matches check failed:', error);
    } finally {
      setIsChecking(false);
      setLoadingPlayers(new Set()); // Clear all loading states
    }
  };

  useEffect(() => {
    if (friends.length > 0) {
      // Initial check after 5 seconds
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 5000);
      
      // Check every 90 seconds for live matches
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 90000);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [friends]);

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
    loadingPlayers,
    checkAllFriendsLiveMatches,
    lastCheckTime
  };
};
