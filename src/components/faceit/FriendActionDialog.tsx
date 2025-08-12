
import React from 'react';
import { PasswordDialog } from './PasswordDialog';
import { Player } from '@/types/Player';

interface PendingAction {
  type: 'add' | 'remove';
  player?: Player;
  playerId?: string;
}

interface FriendActionDialogProps {
  isOpen: boolean;
  pendingAction: PendingAction | null;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export const FriendActionDialog = React.memo(({
  isOpen,
  pendingAction,
  onClose,
  onConfirm
}: FriendActionDialogProps) => {
  const getDialogProps = () => {
    if (!pendingAction) {
      return { title: '', description: '' };
    }

    if (pendingAction.type === 'add') {
      return {
        title: 'Adaugă Prieten',
        description: `Vrei să adaugi ${pendingAction.player?.nickname} în lista de prieteni?`
      };
    }

    return {
      title: 'Șterge Prieten',
      description: 'Vrei să ștergi acest prieten din listă?'
    };
  };

  const { title, description } = getDialogProps();

  return (
    <PasswordDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
    />
  );
});

FriendActionDialog.displayName = 'FriendActionDialog';
