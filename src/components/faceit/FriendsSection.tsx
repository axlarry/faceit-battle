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
import { playerService } from "@/services/playerService";
import { lcryptOptimizedService } from "@/services/lcryptOptimizedService";
import { usePlayerDataUpdater } from "@/hooks/usePlayerDataUpdater";

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
  // Use passed friends and add lcrypt data
  const [friendsWithLcrypt, setFriendsWithLcrypt] = React.useState(friends.map(f => ({ ...f, lcryptData: null })));
  const [liveMatches, setLiveMatches] = React.useState<Record<string, any>>({});
  const [loadingFriends, setLoadingFriends] = React.useState(new Set<string>());
const [isLoading, setIsLoading] = React.useState(false);

  const { updatePlayerData } = usePlayerDataUpdater();

  // Sync with passed friends
  React.useEffect(() => {
    setFriendsWithLcrypt(friends.map(f => ({ 
      ...f, 
      lcryptData: friendsWithLcrypt.find(fl => fl.player_id === f.player_id)?.lcryptData || null 
    })));
  }, [friends]);

  // Load lcrypt data for all friends
  React.useEffect(() => {
    if (friends.length > 0) {
      setIsLoading(true);
      
      const loadFriendData = async () => {
        const promises = friends.map(async (friend) => {
          setLoadingFriends(prev => new Set(prev).add(friend.nickname));
          
          try {
            console.log(`🔍 Loading lcrypt data for ${friend.nickname}...`);
            // Fetch optimized lcrypt data, fresh Faceit profile (for avatar), and cover image in parallel
            const lcryptPromise = lcryptOptimizedService.getCompletePlayerData(friend.nickname);
            const coverPromise = friend.cover_image 
              ? Promise.resolve(friend.cover_image)
              : playerService.getPlayerCoverImage(friend.nickname);
            const faceitPromise = updatePlayerData(friend);

            const [lcryptData, coverImage, updatedPlayer] = await Promise.all([lcryptPromise, coverPromise, faceitPromise]);
            
            console.log(`📊 Lcrypt response for ${friend.nickname}:`, lcryptData);
            if (coverImage) {
              console.log(`🖼️ Cover image ready for ${friend.nickname}`);
            }
            
            if (lcryptData && !lcryptData.error) {
              setFriendsWithLcrypt(prev => 
                prev.map(f => 
                  f.player_id === friend.player_id 
                    ? { 
                        ...f, 
                        lcryptData: lcryptData, 
                        elo: lcryptData.elo || f.elo, 
                        isLive: lcryptData.isLive || false,
                        cover_image: (coverImage as string) || f.cover_image,
                        avatar: (updatedPlayer?.avatar || f.avatar)
                      }
                    : f
                )
              );
              
              setLiveMatches(prev => ({
                ...prev,
                [friend.player_id]: {
                  isLive: lcryptData.isLive || false,
                  matchId: lcryptData.liveInfo?.matchId,
                  competition: lcryptData.liveInfo?.competition,
                  matchDetails: lcryptData.liveInfo?.matchDetails
                }
              }));
              console.log(`✅ Updated ${friend.nickname} with lcrypt data`);
            } else {
              // Even if lcrypt fails, still update cover image and avatar if we have them
              setFriendsWithLcrypt(prev => 
                prev.map(f => 
                  f.player_id === friend.player_id 
                    ? { ...f, cover_image: (coverImage as string) || f.cover_image, avatar: (updatedPlayer?.avatar || f.avatar) }
                    : f
                )
              );
              console.log(`⚠️ No valid lcrypt data for ${friend.nickname}:`, lcryptData);
            }
          } catch (error) {
            console.error(`Failed to load lcrypt data for ${friend.nickname}:`, error);
          } finally {
            setLoadingFriends(prev => {
              const newSet = new Set(prev);
              newSet.delete(friend.nickname);
              return newSet;
            });
          }
        });
        
        await Promise.allSettled(promises);
        setIsLoading(false);
      };
      
      loadFriendData();
    }
  }, [friends]);

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
            isUpdating={isLoading}
            onUpdateAll={() => {}} // Handled internally now
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
