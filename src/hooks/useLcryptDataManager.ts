
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
      const lcryptData = await fetchLcryptData(friend.player_id);
      
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
    
    // Procesează prietenii în paralel cu limit de 3 cereri simultane
    const batchSize = 3;
    const updatedFriends: FriendWithLcrypt[] = [];
    
    for (let i = 0; i < friends.length; i += batchSize) {
      const batch = friends.slice(i, i + batchSize);
      const batchPromises = batch.map(friend => updateFriendLcryptData(friend));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        updatedFriends.push(...batchResults);
        
        // Actualizează progresul
        const progress = Math.min(100, ((updatedFriends.length / friends.length) * 100));
        setLoadingProgress(progress);
        
        // Actualizează starea incrementală pentru feedback vizual rapid
        setFriendsWithLcrypt([...updatedFriends, ...friends.slice(updatedFriends.length).map(f => ({ ...f, lcryptData: null }))]);
        
        console.log(`📊 Progress: ${Math.round(progress)}% (${updatedFriends.length}/${friends.length})`);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză scurtă între batch-uri pentru a evita supraîncărcarea serverului
      if (i + batchSize < friends.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setFriendsWithLcrypt(updatedFriends);
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
