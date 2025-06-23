
import { useCallback } from 'react';
import { Player } from '@/types/Player';
import { useBulkFriendsUpdate } from '@/hooks/useBulkFriendsUpdate';

interface UseFriendsAutoUpdateProps {
  friends: Player[];
  updateFriend: (updatedPlayer: Player) => void;
  reloadFriends: () => void;
  enabled?: boolean;
}

export const useFriendsAutoUpdate = ({ 
  friends, 
  updateFriend,
  reloadFriends,
  enabled = true 
}: UseFriendsAutoUpdateProps) => {
  const { isUpdating, updateAllFriends } = useBulkFriendsUpdate({
    friends,
    updateFriend,
    reloadFriends
  });

  const memoizedUpdateFunction = useCallback(updateAllFriends, [updateAllFriends]);

  // Nu mai folosim auto-update timer deoarece actualizarea individuală 
  // este gestionată de useLcryptDataManager
  console.log('🔄 OPTIMIZED: Auto-update is now handled by individual player updates (1 player every 1.5s after 1.5min delay)');

  return {
    isUpdating,
    updateAllFriends: memoizedUpdateFunction
  };
};
