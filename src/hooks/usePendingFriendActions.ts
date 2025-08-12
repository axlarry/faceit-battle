
import { useState } from 'react';
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

  const handlePlayerFound = (player: Player) => {
    setPendingAction({ type: 'add', player });
    setShowPasswordDialog(true);
  };

  const handleRemoveFriend = (playerId: string) => {
    setPendingAction({ type: 'remove', playerId });
    setShowPasswordDialog(true);
  };

  const confirmAction = (password: string) => {
    if (pendingAction) {
      if (pendingAction.type === 'add' && pendingAction.player) {
        onAddFriend(pendingAction.player, password);
      } else if (pendingAction.type === 'remove' && pendingAction.playerId) {
        onRemoveFriend(pendingAction.playerId, password);
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
