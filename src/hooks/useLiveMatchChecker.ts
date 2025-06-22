
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
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  const { checkPlayerLiveMatch } = useFaceitApi();
  const intervalRef = useRef<NodeJS.Timeout>();
  const liveCheckIntervalRef = useRef<NodeJS.Timeout>();

  // Verificare rapidă doar pentru jucătorii care sunt deja live
  const checkLivePlayersOnly = async () => {
    const livePlayers = friends.filter(friend => liveMatches[friend.player_id]?.isLive);
    
    if (livePlayers.length === 0 || isChecking) return;
    
    console.log(`⚡ Quick live check for ${livePlayers.length} live players...`);
    
    try {
      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      
      for (const player of livePlayers) {
        try {
          console.log(`🔄 Quick check for live player: ${player.nickname}`);
          const liveInfo = await checkPlayerLiveMatch(player.player_id);
          
          newLiveMatches[player.player_id] = liveInfo;
          
          if (liveInfo.isLive) {
            console.log(`✅ ${player.nickname} still live in ${liveInfo.competition}`);
          } else {
            console.log(`❌ ${player.nickname} no longer live`);
          }
          
          // Delay mai scurt pentru verificările rapide - 1 secundă
          if (livePlayers.indexOf(player) < livePlayers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.warn(`⚠️ Quick check error for ${player.nickname}:`, error);
          // Păstrează statusul anterior în caz de eroare
          newLiveMatches[player.player_id] = liveMatches[player.player_id] || { isLive: false };
        }
      }
      
      setLiveMatches(newLiveMatches);
      console.log(`⚡ Quick live check completed for ${livePlayers.length} players`);
      
    } catch (error) {
      console.warn('⚠️ Quick live check failed:', error);
    }
  };

  const checkAllFriendsLiveMatches = async () => {
    if (friends.length === 0 || isChecking) return;
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    
    // Check every 4 minutes to reduce API stress
    if (timeSinceLastCheck < 240000 && initialLoadCompleted) {
      console.log(`⏱️ Skipping full live check, only ${Math.round(timeSinceLastCheck / 1000)}s since last check`);
      return;
    }
    
    setIsChecking(true);
    setLastCheckTime(now);
    console.log(`🔍 Starting full live matches check for ${friends.length} friends...`);
    
    try {
      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      let processedCount = 0;
      
      for (const friend of friends) {
        try {
          console.log(`🎯 Full check for: ${friend.nickname} (${friend.player_id})`);
          const liveInfo = await checkPlayerLiveMatch(friend.player_id);
          
          newLiveMatches[friend.player_id] = liveInfo;
          processedCount++;
          
          if (liveInfo.isLive) {
            console.log(`🟢 LIVE PLAYER DETECTED: ${friend.nickname} in ${liveInfo.competition} (${liveInfo.status}) - Lcrypt Data Available`);
          } else {
            console.log(`⚪ ${friend.nickname} is not live (Lcrypt check)`);
          }
          
          // Longer delay between checks to reduce API stress
          if (processedCount < friends.length) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
        } catch (error) {
          console.warn(`⚠️ Error in full check for ${friend.nickname}:`, error);
          newLiveMatches[friend.player_id] = liveMatches[friend.player_id] || { isLive: false };
        }
      }
      
      setLiveMatches(newLiveMatches);
      
      const liveCount = Object.values(newLiveMatches).filter(match => match.isLive).length;
      console.log(`✅ Full live matches check completed: ${liveCount}/${friends.length} friends are live`);
      
      // Marchează încărcarea inițială ca finalizată doar după prima verificare completă
      if (!initialLoadCompleted) {
        setInitialLoadCompleted(true);
        console.log(`🚀 Initial load completed! Starting rapid live checks in 30 seconds...`);
      }
      
    } catch (error) {
      console.warn('⚠️ Full live matches check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (friends.length > 0) {
      // Initial check after 5 seconds
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 5000);
      
      // Verificare completă la 5 minute pentru toți jucătorii
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 300000);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (liveCheckIntervalRef.current) {
          clearInterval(liveCheckIntervalRef.current);
        }
      };
    }
  }, [friends]);

  // Effect separat pentru verificarea rapidă a jucătorilor live
  useEffect(() => {
    // Pornește verificarea rapidă doar după ce încărcarea inițială s-a terminat
    if (initialLoadCompleted && friends.length > 0) {
      console.log(`🔥 Starting rapid live checks every 30 seconds for live players...`);
      
      // Verificare rapidă la 30 de secunde doar pentru jucătorii live
      liveCheckIntervalRef.current = setInterval(() => {
        checkLivePlayersOnly();
      }, 30000);

      return () => {
        if (liveCheckIntervalRef.current) {
          clearInterval(liveCheckIntervalRef.current);
        }
      };
    }
  }, [initialLoadCompleted, friends, liveMatches]);

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
    lastCheckTime,
    initialLoadCompleted
  };
};
