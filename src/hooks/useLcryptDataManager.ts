
import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/Player';
import { friendDataProcessor } from '@/services/friendDataProcessor';
import { useLcryptLoadingState } from '@/hooks/helpers/useLcryptLoadingState';
import { UseLcryptDataManagerProps, FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  
  const {
    isLoading,
    loadingProgress,
    loadingFriends,
    setLoadingFriends,
    startLoading,
    finishLoading,
    updateProgress,
    canUpdate
  } = useLcryptLoadingState();

  const updateFriendLcryptData = useCallback(async (friend: Player) => {
    return friendDataProcessor.updateFriendData(
      friend,
      enabled,
      setLoadingFriends,
      setFriendsWithLcrypt,
      setLiveMatches
    );
  }, [enabled]);

  const loadLcryptDataForAllFriends = useCallback(async () => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
      return;
    }

    // Verifică dacă au trecut cel puțin 1.5 minute de la ultimul update (optimizat cu mai puține apeluri)
    if (!canUpdate(90000)) { // 1.5 minute = 90000ms
      return;
    }

    startLoading();
    
    // Sortează prietenii după ELO (cel mai mare ELO primul - rank #1)
    const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
    console.log(`🚀 OPTIMIZED Loading: Starting single-call data fetch for ${sortedFriends.length} friends...`);
    
    // Inițializează lista cu toți prietenii cu lcryptData undefined pentru a declașa loading-ul individual
    setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));
    
    // Procesare OPTIMIZATĂ cu batch-uri mai mari deoarece facem mai puține apeluri
    const batchSize = 3; // Mărit de la 2 la 3 deoarece facem un singur apel per jucător
    const updatedFriends: FriendWithLcrypt[] = [];
    
    for (let i = 0; i < sortedFriends.length; i += batchSize) {
      const batch = sortedFriends.slice(i, i + batchSize);
      
      try {
        const validResults = await friendDataProcessor.processFriendsBatch(
          batch,
          updateFriendLcryptData
        );
        
        updatedFriends.push(...validResults);
        
        // Actualizează progresul
        updateProgress(i + batch.length, sortedFriends.length, i, batchSize);
      } catch (error) {
        console.error('Error processing OPTIMIZED batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză redusă între batch-uri deoarece facem mai puține apeluri total
      if (i + batchSize < sortedFriends.length) {
        await new Promise(resolve => setTimeout(resolve, 600)); // Redus de la 800ms la 600ms
      }
    }

    finishLoading();
    console.log(`✅ OPTIMIZED Loading completed: Single-call data fetch for all friends completed successfully`);
  }, [friends, enabled, updateFriendLcryptData, canUpdate, startLoading, finishLoading, updateProgress]);

  // Auto-refresh la intervale optimizate
  useEffect(() => {
    if (!enabled || friends.length === 0) return;

    // Primul load imediat
    loadLcryptDataForAllFriends();

    // Auto-refresh la fiecare 5 minute (optimizat cu mai puține apeluri)
    const interval = setInterval(() => {
      console.log('🔄 OPTIMIZED Auto-refresh: Single-call data fetch (every 5 minutes)...');
      loadLcryptDataForAllFriends();
    }, 300000); // 5 minute = 300000ms

    return () => clearInterval(interval);
  }, [friends, enabled, loadLcryptDataForAllFriends]);

  return {
    friendsWithLcrypt,
    isLoading,
    loadingProgress,
    loadingFriends,
    liveMatches,
    reloadLcryptData: loadLcryptDataForAllFriends
  };
};
