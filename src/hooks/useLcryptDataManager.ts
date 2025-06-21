
import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/Player';
import { fetchLcryptData } from '@/services/lcryptLiveService';

interface UseLcryptDataManagerProps {
  friends: Player[];
  enabled?: boolean;
}

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFriends, setLoadingFriends] = useState<Set<string>>(new Set());

  const updateFriendLcryptData = useCallback(async (friend: Player) => {
    if (!enabled) return friend;

    // Marchează prietenul ca fiind în curs de încărcare
    setLoadingFriends(prev => new Set(prev).add(friend.nickname));

    try {
      console.log(`Fetching Lcrypt data for ${friend.nickname}...`);
      const lcryptData = await fetchLcryptData(friend.nickname);
      
      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        lcryptData,
        elo: lcryptData?.elo || friend.elo || 0
      };

      console.log(`✅ Successfully updated ${friend.nickname} with ELO: ${updatedFriend.elo}`);
      
      // Elimină prietenul din setul de încărcare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return updatedFriend;
    } catch (error) {
      console.error(`❌ Failed to fetch Lcrypt data for ${friend.nickname}:`, error);
      
      // Elimină prietenul din setul de încărcare chiar și în caz de eroare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return { ...friend, lcryptData: null } as FriendWithLcrypt;
    }
  }, [enabled]);

  const loadLcryptDataForAllFriends = useCallback(async () => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    console.log(`🔄 Starting to load Lcrypt data for ${friends.length} friends...`);
    
    // Optimizat pentru încărcare mai rapidă - procesare în batches mai mari cu delay mai mic
    const batchSize = 8; // Crescut de la 5 la 8
    const updatedFriends: FriendWithLcrypt[] = [];
    
    // Inițializează lista cu toți prietenii pentru feedback vizual rapid
    setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
    
    for (let i = 0; i < friends.length; i += batchSize) {
      const batch = friends.slice(i, i + batchSize);
      
      try {
        // Procesează batch-ul în paralel
        const batchPromises = batch.map(friend => updateFriendLcryptData(friend));
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Extrage rezultatele valide
        const validResults = batchResults
          .filter((result): result is PromiseFulfilledResult<FriendWithLcrypt> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);
        
        updatedFriends.push(...validResults);
        
        // Actualizează progresul
        const progress = Math.min(100, ((i + batch.length) / friends.length) * 100);
        setLoadingProgress(progress);
        
        // Actualizează starea incrementală pentru feedback vizual rapid
        setFriendsWithLcrypt(prevFriends => 
          prevFriends.map(prevFriend => {
            const updated = validResults.find(r => r.player_id === prevFriend.player_id);
            return updated || prevFriend;
          })
        );
        
        console.log(`📊 Progress: ${Math.round(progress)}% (${i + batch.length}/${friends.length})`);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză foarte scurtă între batch-uri pentru a nu supraîncărca serverul
      if (i + batchSize < friends.length) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Redus de la 100ms la 50ms
      }
    }

    setIsLoading(false);
    setLoadingProgress(100);
    console.log(`✅ Completed loading Lcrypt data for all friends`);
  }, [friends, enabled, updateFriendLcryptData]);

  useEffect(() => {
    loadLcryptDataForAllFriends();
  }, [loadLcryptDataForAllFriends]);

  return {
    friendsWithLcrypt,
    isLoading,
    loadingProgress,
    loadingFriends,
    reloadLcryptData: loadLcryptDataForAllFriends
  };
};
