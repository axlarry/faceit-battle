import { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';
import { friendDataProcessor } from '@/services/friendDataProcessor';
import { useLcryptLoadingState } from '@/hooks/helpers/useLcryptLoadingState';
import { UseLcryptDataManagerProps, FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [isIndividualUpdating, setIsIndividualUpdating] = useState(false);
  const [isManualUpdate, setIsManualUpdate] = useState(false);
  
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

  const updateFriendLcryptData = useCallback(async (friend: Player, showLoadingOverlay = false) => {
    return friendDataProcessor.updateFriendData(
      friend,
      enabled,
      showLoadingOverlay ? setLoadingFriends : () => {}, // Afișează loading doar pentru încărcarea inițială și manuală
      setFriendsWithLcrypt,
      setLiveMatches
    );
  }, [enabled, setLoadingFriends]);

  // Funcție pentru actualizarea individuală a unui jucător (fără loading overlay)
  const updateSingleFriend = useCallback(async (friend: Player) => {
    if (!enabled) return;
    
    console.log(`🔄 Individual update: Updating ${friend.nickname}...`);
    try {
      await updateFriendLcryptData(friend, false); // false = nu afișa loading overlay
      console.log(`✅ Individual update: ${friend.nickname} completed`);
    } catch (error) {
      console.error(`❌ Individual update failed for ${friend.nickname}:`, error);
    }
  }, [enabled, updateFriendLcryptData]);

  // Funcție pentru începerea ciclului de actualizare individuală
  const startIndividualUpdates = useCallback(() => {
    if (!enabled || friends.length === 0) return;

    console.log(`🚀 Starting individual updates cycle for ${friends.length} friends (1 player every 1.2s)`);
    setIsIndividualUpdating(true);
    currentPlayerIndexRef.current = 0;

    const updateNextPlayer = () => {
      if (currentPlayerIndexRef.current >= friends.length) {
        // Ciclul s-a terminat, resetează pentru următorul ciclu
        console.log(`✅ Individual updates cycle completed. Next cycle in 45 seconds.`);
        currentPlayerIndexRef.current = 0;
        setIsIndividualUpdating(false);
        
        // Programează următorul ciclu după 45 de secunde
        individualUpdateTimeoutRef.current = setTimeout(() => {
          startIndividualUpdates();
        }, 45000); // 45 secunde = 45000ms
        
        return;
      }

      const currentFriend = friends[currentPlayerIndexRef.current];
      updateSingleFriend(currentFriend);
      currentPlayerIndexRef.current++;

      // Programează următorul jucător după 1.2 secunde
      individualUpdateIntervalRef.current = setTimeout(updateNextPlayer, 1200);
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

  const loadLcryptDataForAllFriends = useCallback(async (isManual = false) => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
      return;
    }

    // Pentru actualizările manuale, nu verifica timeout-ul
    if (!isManual && !canUpdate(45000)) { // 45 secunde = 45000ms
      return;
    }

    setIsManualUpdate(isManual);
    
    // Oprește actualizările individuale în timpul încărcării complete
    stopIndividualUpdates();

    startLoading();
    
    // Sortează prietenii după ELO (cel mai mare ELO primul - rank #1)
    const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
    console.log(`🚀 Loading: Starting data fetch for ${sortedFriends.length} friends...`);
    
    // Pentru încărcarea inițială și manuală, marchează prietenii ca fiind în curs de încărcare
    if (isManual) {
      setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));
    } else {
      // Pentru prima încărcare, inițializează lista cu datele existente
      setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));
    }
    
    // Procesare cu batch-uri
    const batchSize = 3;
    const updatedFriends: FriendWithLcrypt[] = [];
    
    for (let i = 0; i < sortedFriends.length; i += batchSize) {
      const batch = sortedFriends.slice(i, i + batchSize);
      
      try {
        const validResults = await friendDataProcessor.processFriendsBatch(
          batch,
          (friend) => updateFriendLcryptData(friend, true) // true = afișează loading pentru încărcarea completă
        );
        
        updatedFriends.push(...validResults);
        
        // Actualizează progresul
        updateProgress(i + batch.length, sortedFriends.length, i, batchSize);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză între batch-uri
      if (i + batchSize < sortedFriends.length) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    finishLoading();
    setIsManualUpdate(false);
    console.log(`✅ Loading completed: Data fetch for all friends completed successfully`);
    
    // Pornește actualizările individuale după 45 de secunde de la finalizarea încărcării
    individualUpdateTimeoutRef.current = setTimeout(() => {
      startIndividualUpdates();
    }, 45000); // 45 secunde = 45000ms
    
  }, [friends, enabled, updateFriendLcryptData, canUpdate, startLoading, finishLoading, updateProgress, stopIndividualUpdates, startIndividualUpdates]);

  // Primul load imediat când se schimbă lista de prieteni
  useEffect(() => {
    if (!enabled || friends.length === 0) return;

    loadLcryptDataForAllFriends(false); // false = nu este manual

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
    isLoading: isLoading || (isManualUpdate && isIndividualUpdating), // Loading doar pentru încărcarea inițială și actualizarea manuală
    loadingProgress,
    loadingFriends,
    liveMatches,
    reloadLcryptData: () => loadLcryptDataForAllFriends(true), // true = este manual
    isIndividualUpdating
  };
};
