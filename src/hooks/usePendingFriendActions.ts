import { useState, useCallback } from 'react';
import { Player } from '@/types/Player';

interface PendingAction {
  type: 'add' | 'remove';
  player?: Player;
  playerId?: string;
}

export const usePendingFriendActions = (
  onAddFriend: (player: Player, password: string) => void,
  onRemoveFriend: (playerId: string, password: string) => void
) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handlePlayerFound = useCallback((player: Player) => {
    setPendingAction({ type: 'add', player });
    setShowPasswordDialog(true);
  }, []);

  const handleRemoveFriend = useCallback((playerId: string) => {
    setPendingAction({ type: 'remove', playerId });
    setShowPasswordDialog(true);
  }, []);

  const confirmAction = useCallback((password: string) => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'add' && pendingAction.player) {
      onAddFriend(pendingAction.player, password);
    } else if (pendingAction.type === 'remove' && pendingAction.playerId) {
      onRemoveFriend(pendingAction.playerId, password);
    }
    setPendingAction(null);
  }, [pendingAction, onAddFriend, onRemoveFriend]);

  const closePasswordDialog = useCallback(() => {
    setShowPasswordDialog(false);
    setPendingAction(null);
  }, []);

  return {
    showPasswordDialog,
    pendingAction,
    handlePlayerFound,
    handleRemoveFriend,
    confirmAction,
    closePasswordDialog
  };
};
