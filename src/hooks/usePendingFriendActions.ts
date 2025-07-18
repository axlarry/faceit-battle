
import { useState } from 'react';
import { Player } from '@/types/Player';

interface PendingAction {
  type: 'add' | 'remove';
  player?: Player;
  playerId?: string;
}

export const usePendingFriendActions = (
  onAddFriend: (player: Player) => void,
  onRemoveFriend: (playerId: string) => void
) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handlePlayerFound = (player: Player) => {
    setPendingAction({ type: 'add', player });
    setShowPasswordDialog(true);
  };

  const handleRemoveFriend = (playerId: string) => {
    setPendingAction({ type: 'remove', playerId });
    setShowPasswordDialog(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      if (pendingAction.type === 'add' && pendingAction.player) {
        onAddFriend(pendingAction.player);
      } else if (pendingAction.type === 'remove' && pendingAction.playerId) {
        onRemoveFriend(pendingAction.playerId);
      }
      setPendingAction(null);
    }
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setPendingAction(null);
  };

  return {
    showPasswordDialog,
    pendingAction,
    handlePlayerFound,
    handleRemoveFriend,
    confirmAction,
    closePasswordDialog
  };
};
