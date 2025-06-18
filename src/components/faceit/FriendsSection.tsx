
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Player } from "@/types/Player";
import { Users } from "lucide-react";
import { PasswordDialog } from "./PasswordDialog";
import { useFriendsAutoUpdate } from "@/hooks/useFriendsAutoUpdate";
import { useLcryptDataManager } from "@/hooks/useLcryptDataManager";
import { FriendsSectionHeader } from "./FriendsSectionHeader";
import { FriendSearchForm } from "./FriendSearchForm";
import { FriendListItem } from "./FriendListItem";
import { Progress } from "@/components/ui/progress";

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

  // Sortare prieteni după ELO
  const sortedFriends = React.useMemo(() => {
    return [...friendsWithLcrypt].sort((a, b) => (b.elo || 0) - (a.elo || 0));
  }, [friendsWithLcrypt]);

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
          
          {/* Progress bar pentru încărcarea datelor ELO */}
          {lcryptLoading && friends.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm text-[#9f9f9f]">
                <span>Se încarcă datele ELO...</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
            </div>
          )}
          
          {friends.length === 0 ? (
            <div className="text-center py-8 md:py-10">
              <div className="w-16 h-16 md:w-18 md:h-18 bg-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users size={28} className="md:w-9 md:h-9 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">Niciun prieten adăugat</h3>
              <p className="text-[#9f9f9f] text-sm md:text-base mb-4">Caută și adaugă prieteni pentru a-i vedea în clasamentul tău personal!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFriends.map((friend, index) => (
                <FriendListItem
                  key={friend.player_id}
                  friend={friend}
                  index={index}
                  isFlashing={flashingPlayer === friend.player_id}
                  onPlayerClick={handlePlayerClick}
                />
              ))}
            </div>
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
