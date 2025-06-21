
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
    
    // Check less frequently to avoid rate limiting (minimum 2 minutes)
    if (timeSinceLastCheck < 120000) {
      console.log(`⏱️ Skipping live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting enhanced live matches check for ${friends.length} friends...`);
    
    try {
      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      let processedCount = 0;
      
      for (const friend of friends) {
        try {
          console.log(`🎯 Enhanced checking live status for: ${friend.nickname} (${friend.player_id})`);
          const liveInfo = await checkPlayerLiveMatch(friend.player_id);
          
          newLiveMatches[friend.player_id] = liveInfo;
          processedCount++;
          
          if (liveInfo.isLive) {
            console.log(`🟢 LIVE PLAYER DETECTED: ${friend.nickname} in ${liveInfo.competition} (${liveInfo.status}${liveInfo.state ? ` / ${liveInfo.state}` : ''}) - Match ID: ${liveInfo.matchId}`);
          } else {
            console.log(`⚪ ${friend.nickname} is not live (enhanced check)`);
          }
          
          // Longer delay between checks to respect rate limits
          if (processedCount < friends.length) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error in enhanced check for ${friend.nickname}:`, error);
          newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const liveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`✅ Enhanced live matches check completed: ${liveCount}/${friends.length} friends are live`);
      
    } catch (error) {
      console.warn('⚠️ Enhanced live matches check failed:', error);
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
      
      // Check every 5 minutes for live matches
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 300000);

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
