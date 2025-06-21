
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
      // Verificăm doar câțiva prieteni la un moment dat pentru a reduce load-ul
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < friends.length; i += batchSize) {
        batches.push(friends.slice(i, i + batchSize));
      }

      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      
      // Procesăm batch-urile cu delay între ele
      for (const batch of batches) {
        const batchPromises = batch.map(async (friend) => {
          try {
            const liveInfo = await checkPlayerLiveMatch(friend.player_id);
            return { playerId: friend.player_id, liveInfo };
          } catch (error) {
            console.error(`Error checking live match for ${friend.nickname}:`, error);
            // Păstrăm starea anterioară în caz de eroare
            return { playerId: friend.player_id, liveInfo: liveMatches[friend.player_id] || { isLive: false } };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ playerId, liveInfo }) => {
          newLiveMatches[playerId] = liveInfo;
        });

        // Delay de 1 secundă între batch-uri pentru a nu suprasolicita API-ul
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
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
      // Delay inițial de 2 secunde pentru a nu face request imediat la load
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 2000);
      
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 240000); // 4 minute (240000ms)

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
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
