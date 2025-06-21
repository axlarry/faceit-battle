
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

    // Verifică dacă au trecut cel puțin 2 minute de la ultimul update pentru a reduce stresul pe API
    if (!canUpdate(120000)) { // 2 minute = 120000ms
      return;
    }

    startLoading();
    
    // Sortează prietenii după ELO (cel mai mare ELO primul - rank #1)
    const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
    console.log(`🔄 Starting to load Lcrypt data, live status and cover images for ${sortedFriends.length} friends in rank order...`);
    
    // Inițializează lista cu toți prietenii cu lcryptData undefined pentru a declașa loading-ul individual
    setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));
    
    // Procesare individuală pentru fiecare prieten cu delay mai mare între requesturi
    const batchSize = 2; // Redus pentru a nu supraîncărca serverul
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
        console.error('Error processing batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză mai mare între batch-uri pentru a nu supraîncărca serverul Lcrypt
      if (i + batchSize < sortedFriends.length) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay
      }
    }

    finishLoading();
    console.log(`✅ Completed loading Lcrypt data, live status and cover images for all friends in rank order`);
  }, [friends, enabled, updateFriendLcryptData, canUpdate, startLoading, finishLoading, updateProgress]);

  // Auto-refresh la intervale mai mici
  useEffect(() => {
    if (!enabled || friends.length === 0) return;

    // Primul load imediat
    loadLcryptDataForAllFriends();

    // Auto-refresh la fiecare 5 minute
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing Lcrypt data (every 5 minutes)...');
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
