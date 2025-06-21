
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
    console.log(`Checking live matches for ${friends.length} friends...`);
    
    try {
      // Verificăm doar 2 prieteni la un moment dat și cu delay mai mare
      const batchSize = 2;
      const batches = [];
      
      for (let i = 0; i < friends.length; i += batchSize) {
        batches.push(friends.slice(i, i + batchSize));
      }

      const newLiveMatches: Record<string, LiveMatchInfo> = { ...liveMatches };
      
      // Procesăm batch-urile cu delay de 3 secunde între ele
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Delay între batch-uri (except primul)
        if (batchIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const batchPromises = batch.map(async (friend) => {
          try {
            const liveInfo = await checkPlayerLiveMatch(friend.player_id);
            return { playerId: friend.player_id, liveInfo };
          } catch (error) {
            // În caz de eroare, păstrăm starea anterioară sau setăm ca offline
            return { 
              playerId: friend.player_id, 
              liveInfo: liveMatches[friend.player_id] || { isLive: false } 
            };
          }
        });

        try {
          const batchResults = await Promise.all(batchPromises);
          
          batchResults.forEach(({ playerId, liveInfo }) => {
            newLiveMatches[playerId] = liveInfo;
          });
        } catch (error) {
          console.warn('Batch processing failed, skipping this batch');
        }
      }
      
      setLiveMatches(newLiveMatches);
      console.log(`Live matches check completed for ${friends.length} friends`);
    } catch (error) {
      console.warn('Live matches check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verifică la început cu delay mai mare și apoi la fiecare 6 minute
  useEffect(() => {
    if (friends.length > 0) {
      // Delay inițial de 5 secunde pentru a nu face request imediat la load
      const initialTimeout = setTimeout(() => {
        checkAllFriendsLiveMatches();
      }, 5000);
      
      // Interval de 6 minute (360000ms) pentru a reduce stresul pe API
      intervalRef.current = setInterval(() => {
        checkAllFriendsLiveMatches();
      }, 360000);

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
