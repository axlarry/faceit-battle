
import { useState, useCallback } from 'react';
import { Player } from '@/types/Player';

interface UseBulkFriendsUpdateProps {
  friends: Player[];
  updateFriend: (updatedPlayer: Player) => void;
  reloadFriends: () => void;
}

export const useBulkFriendsUpdate = ({ 
  friends, 
  updateFriend,
  reloadFriends 
}: UseBulkFriendsUpdateProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAllFriends = useCallback(async () => {
    if (isUpdating || friends.length === 0) return;
    
    setIsUpdating(true);
    console.log(`🔄 OPTIMIZED: Starting bulk update using only Lcrypt data for ${friends.length} friends`);
    
    try {
      // Nu mai facem apeluri separate către Faceit API
      // Datele sunt deja actualizate prin useLcryptDataManager
      console.log(`✅ OPTIMIZED: Bulk update completed - using existing Lcrypt data`);
      console.log(`📊 OPTIMIZATION: Saved ${friends.length * 2} API calls (eliminated Faceit API calls)`);
      
      // Reîncărcăm lista de prieteni pentru a actualiza UI-ul
      reloadFriends();
      
    } catch (error) {
      console.error('❌ Error during optimized bulk friends update:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [friends, reloadFriends, isUpdating]);

  return {
    isUpdating,
    updateAllFriends
  };
};
