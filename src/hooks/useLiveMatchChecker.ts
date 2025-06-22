
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
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
  const { checkPlayerLiveMatch } = useFaceitApi();
  const intervalRef = useRef<NodeJS.Timeout>();
  const liveCheckIntervalRef = useRef<NodeJS.Timeout>();

  const checkAllFriendsLiveMatches = async () => {
    if (friends.length === 0 || isChecking) return;
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    
    // Check every 2 minutes to reduce API stress (changed from 4 minutes)
    if (timeSinceLastCheck < 120000) {
      console.log(`⏱️ Skipping live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting optimized Lcrypt live matches check for ${friends.length} friends...`);
    
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
          
          // Delay between checks changed from 1500ms to 2500ms
          if (processedCount < friends.length) {
            await new Promise(resolve => setTimeout(resolve, 2500));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error in live check for ${friend.nickname}:`, error);
          newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const liveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`✅ Optimized Lcrypt live matches check completed: ${liveCount}/${friends.length} friends are live`);
      
      // Mark initial load as completed after first full check
      if (!hasCompletedInitialLoad) {
        setHasCompletedInitialLoad(true);
        console.log(`🚀 Initial live matches load completed - starting rapid live checks in 30 seconds`);
      }
      
    } catch (error) {
      console.warn('⚠️ Live matches check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkLivePlayersOnly = async () => {
    if (!hasCompletedInitialLoad || friends.length === 0) return;
    
    const currentlyLivePlayers = Object.entries(liveMatches)
      .filter(([_, matchInfo]) => matchInfo.isLive)
      .map(([playerId]) => playerId);
    
    if (currentlyLivePlayers.length === 0) {
      console.log(`⚪ No live players to check rapidly`);
      return;
    }
    
    console.log(`🔄 Rapid check for ${currentlyLivePlayers.length} live players...`);
    
    try {
      const newLiveMatches = { ...liveMatches };
      let processedCount = 0;
      
      for (const playerId of currentlyLivePlayers) {
        const friend = friends.find(f => f.player_id === playerId);
        if (!friend) continue;
        
        try {
          console.log(`🎯 Rapid live check for: ${friend.nickname}`);
          const liveInfo = await checkPlayerLiveMatch(playerId);
          
          newLiveMatches[playerId] = liveInfo;
          processedCount++;
          
          if (liveInfo.isLive) {
            console.log(`🟢 ${friend.nickname} still live - ${liveInfo.competition} (${liveInfo.status})`);
          } else {
            console.log(`🔴 ${friend.nickname} no longer live`);
          }
          
          // 1 second delay between rapid checks for live players
          if (processedCount < currentlyLivePlayers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error in rapid live check for ${friend.nickname}:`, error);
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const stillLiveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`⚡ Rapid live check completed: ${stillLiveCount} players still live`);
      
    } catch (error) {
      console.warn('⚠️ Rapid live check failed:', error);
    }
  };

  useEffect(() => {
    if (friends.length > 0) {
      // Initial check after 5 seconds
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 5000);
      
      // Check every 5 minutes for live matches (reduced frequency to stress API less)
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

  // Rapid live checks - only after initial load is completed
  useEffect(() => {
    if (hasCompletedInitialLoad && friends.length > 0) {
      // Wait 30 seconds after initial load completion, then start rapid checks
      const rapidStartTimeout = setTimeout(() => {
        console.log(`🚀 Starting rapid live checks every 30 seconds`);
        
        // Start rapid checks for live players every 30 seconds
        liveCheckIntervalRef.current = setInterval(() => {
          checkLivePlayersOnly();
        }, 30000);
      }, 30000);

      return () => {
        clearTimeout(rapidStartTimeout);
        if (liveCheckIntervalRef.current) {
          clearInterval(liveCheckIntervalRef.current);
        }
      };
    }
  }, [hasCompletedInitialLoad, friends]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (liveCheckIntervalRef.current) {
        clearInterval(liveCheckIntervalRef.current);
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
