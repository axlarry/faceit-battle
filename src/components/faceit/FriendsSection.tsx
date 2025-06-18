
import React from "react";
import { Card } from "@/components/ui/card";
import { Player } from "@/types/Player";
import { useFriendsAutoUpdate } from "@/hooks/useFriendsAutoUpdate";
import { useLcryptDataManager } from "@/hooks/useLcryptDataManager";
import { usePendingFriendActions } from "@/hooks/usePendingFriendActions";
import { useFlashingPlayer } from "@/hooks/useFlashingPlayer";
import { FriendsSectionHeader } from "./FriendsSectionHeader";
import { FriendSearchForm } from "./FriendSearchForm";
import { EmptyFriendsState } from "./EmptyFriendsState";
import { ModernLoadingOverlay } from "./ModernLoadingOverlay";
import { FriendsList } from "./FriendsList";
import { FriendActionDialog } from "./FriendActionDialog";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
  onUpdateFriend?: (player: Player) => void;
  onReloadFriends?: () => void;
}

export const FriendsSection = ({ 
  friends, 
  onAddFriend, 
  onRemoveFriend, 
  onShowPlayerDetails,
  onUpdateFriend,
  onReloadFriends
}: FriendsSectionProps) => {
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

  // Handle pending friend actions
  const {
    showPasswordDialog,
    pendingAction,
    handlePlayerFound,
    handleRemoveFriend,
    confirmAction,
    closePasswordDialog
  } = usePendingFriendActions(onAddFriend, onRemoveFriend);

  // Handle flashing player state
  const { flashingPlayer, handlePlayerClick } = useFlashingPlayer(onShowPlayerDetails);

  return (
    <div className="space-y-4 px-4 md:px-0">
      <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl relative">
        <div className="p-4 md:p-5">
          <FriendsSectionHeader 
            friendsCount={friends.length}
            isUpdating={isUpdating || lcryptLoading}
            onUpdateAll={updateAllFriends}
          />

          <FriendSearchForm onPlayerFound={handlePlayerFound} />
          
          {friends.length === 0 ? (
            <EmptyFriendsState />
          ) : (
            <div className="relative">
              <div className={lcryptLoading ? 'opacity-30 pointer-events-none' : ''}>
                <FriendsList 
                  friends={friendsWithLcrypt}
                  flashingPlayer={flashingPlayer}
                  onPlayerClick={handlePlayerClick}
                />
              </div>
              
              <ModernLoadingOverlay 
                isLoading={lcryptLoading}
                progress={loadingProgress}
                friendsCount={friends.length}
              />
            </div>
          )}
        </div>
      </Card>

      <FriendActionDialog
        isOpen={showPasswordDialog}
        pendingAction={pendingAction}
        onClose={closePasswordDialog}
        onConfirm={confirmAction}
      />
    </div>
  );
};
