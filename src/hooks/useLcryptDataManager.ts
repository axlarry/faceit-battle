
import { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';
import { friendDataProcessor } from '@/services/friendDataProcessor';
import { useLcryptLoadingState } from '@/hooks/helpers/useLcryptLoadingState';
import { UseLcryptDataManagerProps, FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [isIndividualUpdating, setIsIndividualUpdating] = useState(false);
  
  const individualUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const individualUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPlayerIndexRef = useRef(0);
  
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

  // Funcție pentru actualizarea individuală a unui jucător
  const updateSingleFriend = useCallback(async (friend: Player) => {
    if (!enabled) return;
    
    console.log(`🔄 Individual update: Updating ${friend.nickname}...`);
    try {
      await updateFriendLcryptData(friend);
      console.log(`✅ Individual update: ${friend.nickname} completed`);
    } catch (error) {
      console.error(`❌ Individual update failed for ${friend.nickname}:`, error);
    }
  }, [enabled, updateFriendLcryptData]);

  // Funcție pentru începerea ciclului de actualizare individuală
  const startIndividualUpdates = useCallback(() => {
    if (!enabled || friends.length === 0) return;

    console.log(`🚀 Starting individual updates cycle for ${friends.length} friends (1 player every 1.5s)`);
    setIsIndividualUpdating(true);
    currentPlayerIndexRef.current = 0;

    const updateNextPlayer = () => {
      if (currentPlayerIndexRef.current >= friends.length) {
        // Ciclul s-a terminat, resetează pentru următorul ciclu
        console.log(`✅ Individual updates cycle completed. Next cycle in 1.5 minutes.`);
        currentPlayerIndexRef.current = 0;
        setIsIndividualUpdating(false);
        
        // Programează următorul ciclu după 1.5 minute
        individualUpdateTimeoutRef.current = setTimeout(() => {
          startIndividualUpdates();
        }, 90000); // 1.5 minute = 90000ms
        
        return;
      }

      const currentFriend = friends[currentPlayerIndexRef.current];
      updateSingleFriend(currentFriend);
      currentPlayerIndexRef.current++;

      // Programează următorul jucător după 1.5 secunde
      individualUpdateIntervalRef.current = setTimeout(updateNextPlayer, 1500);
    };

    // Începe primul update
    updateNextPlayer();
  }, [friends, enabled, updateSingleFriend]);

  // Funcție pentru oprirea actualizărilor individuale
  const stopIndividualUpdates = useCallback(() => {
    if (individualUpdateTimeoutRef.current) {
      clearTimeout(individualUpdateTimeoutRef.current);
      individualUpdateTimeoutRef.current = null;
    }
    if (individualUpdateIntervalRef.current) {
      clearTimeout(individualUpdateIntervalRef.current);
      individualUpdateIntervalRef.current = null;
    }
    setIsIndividualUpdating(false);
    console.log('🛑 Individual updates stopped');
  }, []);

  const loadLcryptDataForAllFriends = useCallback(async () => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
      return;
    }

    // Verifică dacă au trecut cel puțin 1.5 minute de la ultimul update (optimizat cu mai puține apeluri)
    if (!canUpdate(90000)) { // 1.5 minute = 90000ms
      return;
    }

    // Oprește actualizările individuale în timpul încărcării complete
    stopIndividualUpdates();

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
    
    // Pornește actualizările individuale după 1.5 minute de la finalizarea încărcării inițiale
    individualUpdateTimeoutRef.current = setTimeout(() => {
      startIndividualUpdates();
    }, 90000); // 1.5 minute = 90000ms
    
  }, [friends, enabled, updateFriendLcryptData, canUpdate, startLoading, finishLoading, updateProgress, stopIndividualUpdates, startIndividualUpdates]);

  // Primul load imediat când se schimbă lista de prieteni
  useEffect(() => {
    if (!enabled || friends.length === 0) return;

    loadLcryptDataForAllFriends();

    // Cleanup la unmount sau când se schimbă prietenii
    return () => {
      stopIndividualUpdates();
    };
  }, [friends, enabled, loadLcryptDataForAllFriends, stopIndividualUpdates]);

  // Cleanup la unmount
  useEffect(() => {
    return () => {
      stopIndividualUpdates();
    };
  }, [stopIndividualUpdates]);

  return {
    friendsWithLcrypt,
    isLoading: isLoading || isIndividualUpdating,
    loadingProgress,
    loadingFriends,
    liveMatches,
    reloadLcryptData: loadLcryptDataForAllFriends,
    isIndividualUpdating
  };
};
