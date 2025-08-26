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
import { FriendsList } from "./FriendsList";
import { FriendActionDialog } from "./FriendActionDialog";
import { PasswordDialog } from "./PasswordDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player, password: string) => void;
  onRemoveFriend: (playerId: string, password: string) => void;
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
  // Hook optimizat pentru datele Lcrypt și statusul LIVE
  const { friendsWithLcrypt, isLoading: lcryptLoading, loadingProgress, loadingFriends, liveMatches } = useLcryptDataManager({
    friends,
    enabled: true
  });

  // Password dialog pentru migrare
  const [showMigratePassword, setShowMigratePassword] = React.useState(false);

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

  // Calculate live players count and extract live friends from integrated data
  const { livePlayersCount, liveFriends } = React.useMemo(() => {
    const livePlayers = friendsWithLcrypt.filter(friend => {
      const liveInfo = liveMatches[friend.player_id];
      return liveInfo?.isLive;
    });
    
    return {
      livePlayersCount: livePlayers.length,
      liveFriends: livePlayers
    };
  }, [friendsWithLcrypt, liveMatches]);

  return (
    <div className="space-y-4 px-4 md:px-0">
      <Card className="glass-card border shadow-2xl">
        <div className="p-4 md:p-5">
          <FriendsSectionHeader 
            friendsCount={friends.length}
            livePlayersCount={livePlayersCount}
            isUpdating={isUpdating || lcryptLoading}
            onUpdateAll={updateAllFriends}
            lcryptFriends={friendsWithLcrypt}
            lcryptLoading={lcryptLoading}
            liveFriends={liveFriends}
            liveMatches={liveMatches}
          />

          {/* Căutare prieteni */}
          <FriendSearchForm onPlayerFound={handlePlayerFound} />
          
          {friends.length === 0 ? (
            <EmptyFriendsState onMigrate={() => setShowMigratePassword(true)} />
          ) : (
            <FriendsList 
              friends={friendsWithLcrypt}
              flashingPlayer={flashingPlayer}
              loadingFriends={loadingFriends}
              liveMatches={liveMatches}
              onPlayerClick={handlePlayerClick}
            />
          )}
        </div>
      </Card>

      <FriendActionDialog
        isOpen={showPasswordDialog}
        pendingAction={pendingAction}
        onClose={closePasswordDialog}
        onConfirm={confirmAction}
      />

      <PasswordDialog
        isOpen={showMigratePassword}
        onClose={() => setShowMigratePassword(false)}
        onConfirm={async (password) => {
          try {
            const { data, error } = await supabase.functions.invoke('friends-gateway', {
              body: { action: 'migrate_auto', password }
            });
            if (error) {
              toast({ title: 'Migrare eșuată', description: 'Parola invalidă sau eroare la gateway.', variant: 'destructive' });
              return;
            }
            const info = data as any;
            toast({ title: 'Migrare reușită', description: `Inserate: ${info?.migratedInserted || 0}, Actualizate: ${info?.migratedUpdated || 0}` });
            onReloadFriends?.();
          } catch (e) {
            toast({ title: 'Migrare eșuată', description: 'A apărut o eroare în timpul migrării.', variant: 'destructive' });
          } finally {
            setShowMigratePassword(false);
          }
        }}
        title="Migrează lista veche"
        description="Introdu parola pentru a migra lista ta veche de prieteni în lista publică."
      />
    </div>
  );
};
