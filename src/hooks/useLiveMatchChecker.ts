import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/Player';
import { useFaceitApi } from './useFaceitApi';

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  status?: string;
  matchDetails?: any;
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
    
    // Don't check too frequently (minimum 2 minutes between checks)
    if (timeSinceLastCheck < 120000) {
      console.log(`⏱️ Skipping live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting live matches check for ${friends.length} friends...`);
    
    try {
      // Process friends in smaller batches with longer delays to avoid rate limiting
      const batchSize = 1; // Reduced to 1 to be more conservative
      const batches = [];
      
      for (let i = 0; i < friends.length; i += batchSize) {
        batches.push(friends.slice(i, i + batchSize));
      }

      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      let processedCount = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Progressive delay between batches (starts at 2s, increases)
        if (batchIndex > 0) {
          const delay = Math.min(2000 + (batchIndex * 500), 5000);
          console.log(`⏳ Waiting ${delay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        for (const friend of batch) {
          try {
            console.log(`🎯 Checking live status for: ${friend.nickname} (${friend.player_id})`);
            const liveInfo = await checkPlayerLiveMatch(friend.player_id);
            
            newLiveMatches[friend.player_id] = liveInfo;
            processedCount++;
            
            if (liveInfo.isLive) {
              console.log(`🟢 LIVE PLAYER FOUND: ${friend.nickname} in ${liveInfo.competition} (${liveInfo.status})`);
            } else {
              console.log(`⚪ ${friend.nickname} is not live`);
            }
            
            // Small delay between individual checks
            if (processedCount < friends.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
          } catch (error) {
            console.warn(`⚠️ Error checking ${friend.nickname}:`, error);
            // Keep previous state on error
            newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
          }
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
      // Initial check after 3 seconds
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 3000);
      
      // Periodic checks every 4 minutes (240000ms)
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 240000);

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
