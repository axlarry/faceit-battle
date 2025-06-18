
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Player } from "@/types/Player";
import { PasswordDialog } from "./PasswordDialog";
import { useFriendsAutoUpdate } from "@/hooks/useFriendsAutoUpdate";
import { useLcryptDataManager } from "@/hooks/useLcryptDataManager";
import { FriendsSectionHeader } from "./FriendsSectionHeader";
import { FriendSearchForm } from "./FriendSearchForm";
import { EmptyFriendsState } from "./EmptyFriendsState";
import { FriendsLoadingProgress } from "./FriendsLoadingProgress";
import { FriendsList } from "./FriendsList";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
  onUpdateFriend?: (player: Player) => void;
  onReloadFriends?: () => void;
}

interface PendingAction {
  type: 'add' | 'remove';
  player?: Player;
  playerId?: string;
}

export const FriendsSection = ({ 
  friends, 
  onAddFriend, 
  onRemoveFriend, 
  onShowPlayerDetails,
  onUpdateFriend,
  onReloadFriends
}: FriendsSectionProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [flashingPlayer, setFlashingPlayer] = useState<string | null>(null);

  // Hook optimizat pentru datele Lcrypt
  const { friendsWithLcrypt, isLoading: lcryptLoading, loadingProgress } = useLcryptDataManager({
    friends,
    enabled: true
  });

  // Auto-update friends data every 5 minutes
  const { isUpdating, updateAllFriends } = useFriendsAutoUpdate({
    friends,
    updateFriend: onUpdateFriend || (() => {}),
    reloadFriends: onReloadFriends || (() => {}),
    enabled: true
  });

  const handlePlayerFound = (player: Player) => {
    setPendingAction({ type: 'add', player });
    setShowPasswordDialog(true);
  };

  const handleRemoveFriend = (playerId: string) => {
    setPendingAction({ type: 'remove', playerId });
    setShowPasswordDialog(true);
  };

  const handlePlayerClick = (player: Player) => {
    setFlashingPlayer(player.player_id);
    setTimeout(() => {
      setFlashingPlayer(null);
      onShowPlayerDetails(player);
    }, 200);
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

  return (
    <div className="space-y-4 px-4 md:px-0">
      <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl">
        <div className="p-4 md:p-5">
          <FriendsSectionHeader 
            friendsCount={friends.length}
            isUpdating={isUpdating || lcryptLoading}
            onUpdateAll={updateAllFriends}
          />

          <FriendSearchForm onPlayerFound={handlePlayerFound} />
          
          <FriendsLoadingProgress 
            isLoading={lcryptLoading}
            progress={loadingProgress}
            friendsCount={friends.length}
          />
          
          {friends.length === 0 ? (
            <EmptyFriendsState />
          ) : (
            <FriendsList 
              friends={friendsWithLcrypt}
              flashingPlayer={flashingPlayer}
              onPlayerClick={handlePlayerClick}
            />
          )}
        </div>
      </Card>

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={closePasswordDialog}
        onConfirm={confirmAction}
        title={pendingAction?.type === 'add' ? 'Adaugă Prieten' : 'Șterge Prieten'}
        description={
          pendingAction?.type === 'add' 
            ? `Vrei să adaugi ${pendingAction.player?.nickname} în lista de prieteni?`
            : 'Vrei să ștergi acest prieten din listă?'
        }
      />
    </div>
  );
};
