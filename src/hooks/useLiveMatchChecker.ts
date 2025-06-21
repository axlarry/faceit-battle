import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/Player';
import { useFaceitApi } from './useFaceitApi';

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  status?: string;
  matchDetails?: any;
  liveMatch?: any; // Full match object for live matches
}

export const useLiveMatchChecker = (friends: Player[]) => {
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const { checkPlayerLiveMatch } = useFaceitApi();
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkAllFriendsLiveMatches = async () => {
    if (friends.length === 0 || isChecking) return;
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    
    // Don't check too frequently (minimum 90 seconds between checks for better detection)
    if (timeSinceLastCheck < 90000) {
      console.log(`⏱️ Skipping live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting live matches check for ${friends.length} friends...`);
    
    try {
      // Process friends individually with delays
      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      let processedCount = 0;
      
      for (const friend of friends) {
        try {
          console.log(`🎯 Checking live status for: ${friend.nickname} (${friend.player_id})`);
          const liveInfo = await checkPlayerLiveMatch(friend.player_id);
          
          newLiveMatches[friend.player_id] = liveInfo;
          processedCount++;
          
          if (liveInfo.isLive) {
            console.log(`🟢 LIVE PLAYER FOUND: ${friend.nickname} in ${liveInfo.competition} (${liveInfo.status}) - Match ID: ${liveInfo.matchId}`);
          } else {
            console.log(`⚪ ${friend.nickname} is not live`);
          }
          
          // Delay between individual checks (reduced to 800ms for faster detection)
          if (processedCount < friends.length) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error checking ${friend.nickname}:`, error);
          // Keep previous state on error
          newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const liveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`✅ Live matches check completed: ${liveCount}/${friends.length} friends are live`);
      
    } catch (error) {
      console.warn('⚠️ Live matches check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Check initially after a delay and then periodically
  useEffect(() => {
    if (friends.length > 0) {
      // Initial check after 2 seconds
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 2000);
      
      // Periodic checks every 3 minutes (180000ms) for more frequent updates
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 180000);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [friends]);

  // Cleanup on unmount
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
    checkAllFriendsLiveMatches,
    lastCheckTime
  };
};
