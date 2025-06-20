
import { useCallback } from 'react';
import { Player } from '@/types/Player';
import { useAutoUpdateTimer } from '@/hooks/useAutoUpdateTimer';
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

  useAutoUpdateTimer({
    enabled,
    itemCount: friends.length,
    updateFunction: memoizedUpdateFunction,
    intervalMs: 900000 // 15 minutes (900000ms)
  });

  return {
    isUpdating,
    updateAllFriends
  };
};
