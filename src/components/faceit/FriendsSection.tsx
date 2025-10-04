import React from "react";
import { Card } from "@/components/ui/card";
import { Player } from "@/types/Player";
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
import { useLcryptDataManager } from "@/hooks/useLcryptDataManager";

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
  // Use optimized lcrypt data manager with batch processing and rate limiting
  const {
    friendsWithLcrypt,
    isLoading,
    loadingProgress,
    loadingFriends,
    liveMatches,
    reloadLcryptData,
    isIndividualUpdating
  } = useLcryptDataManager({ 
    friends, 
    enabled: true 
  });

  const livePlayersCount = Object.values(liveMatches).filter(m => m.isLive).length;
  const liveFriends = friendsWithLcrypt.filter(f => liveMatches[f.player_id]?.isLive);

  // Password dialog pentru migrare
  const [showMigratePassword, setShowMigratePassword] = React.useState(false);

  // Handle pending friend actions with optimized functions
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
      <Card className="glass-card border shadow-2xl">
        <div className="p-4 md:p-5">
          <FriendsSectionHeader 
            friendsCount={friendsWithLcrypt.length}
            livePlayersCount={livePlayersCount}
            isUpdating={isLoading || isIndividualUpdating}
            onUpdateAll={reloadLcryptData}
            lcryptFriends={friendsWithLcrypt}
            lcryptLoading={isLoading}
            liveFriends={liveFriends}
            liveMatches={liveMatches}
          />

          {/* Căutare prieteni */}
          <FriendSearchForm onPlayerFound={handlePlayerFound} />
          
          {friendsWithLcrypt.length === 0 ? (
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
