
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
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const { checkPlayerLiveMatch } = useFaceitApi();
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkAllFriendsLiveMatches = async () => {
    if (friends.length === 0 || isChecking) return;
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    
    // Check every 2 minutes to avoid rate limiting
    if (timeSinceLastCheck < 120000) {
      console.log(`⏱️ Skipping live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting Lcrypt live matches check for ${friends.length} friends...`);
    
    try {
      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      let processedCount = 0;
      
      for (const friend of friends) {
        try {
          console.log(`🎯 Checking live status via Lcrypt for: ${friend.nickname} (${friend.player_id})`);
          const liveInfo = await checkPlayerLiveMatch(friend.player_id);
          
          newLiveMatches[friend.player_id] = liveInfo;
          processedCount++;
          
          if (liveInfo.isLive) {
            console.log(`🟢 LIVE PLAYER DETECTED: ${friend.nickname} in ${liveInfo.competition} (${liveInfo.status}) - Lcrypt Data Available`);
          } else {
            console.log(`⚪ ${friend.nickname} is not live (Lcrypt check)`);
          }
          
          // Delay between checks to respect rate limits
          if (processedCount < friends.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error in live check for ${friend.nickname}:`, error);
          newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const liveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`✅ Lcrypt live matches check completed: ${liveCount}/${friends.length} friends are live`);
      
    } catch (error) {
      console.warn('⚠️ Live matches check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (friends.length > 0) {
      // Initial check after 3 seconds
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 3000);
      
      // Check every 3 minutes for live matches (reduced frequency)
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
