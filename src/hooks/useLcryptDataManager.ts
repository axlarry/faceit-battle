
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
      
      // Actualizează prietenul în lista principală imediat după finalizare
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === updatedFriend.player_id ? updatedFriend : prevFriend
        )
      );
      
      // Elimină prietenul din setul de încărcare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return updatedFriend;
    } catch (error) {
      console.error(`❌ Failed to fetch Lcrypt data for ${friend.nickname}:`, error);
      
      // Actualizează cu date null în caz de eroare
      const failedFriend: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === failedFriend.player_id ? failedFriend : prevFriend
        )
      );
      
      // Elimină prietenul din setul de încărcare chiar și în caz de eroare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return failedFriend;
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
    
    // Inițializează lista cu toți prietenii cu lcryptData undefined pentru a declașa loading-ul individual
    setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: undefined })));
    
    // Procesare individuală pentru fiecare prieten
    const batchSize = 3; // Redus pentru a nu supraîncărca serverul
    const updatedFriends: FriendWithLcrypt[] = [];
    
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
        
        console.log(`📊 Progress: ${Math.round(progress)}% (${i + batch.length}/${friends.length})`);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză între batch-uri pentru a nu supraîncărca serverul
      if (i + batchSize < friends.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
