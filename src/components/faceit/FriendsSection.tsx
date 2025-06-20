
import React from 'react';
import { Player } from "@/types/Player";
import { FriendsSectionHeader } from './FriendsSectionHeader';
import { FriendsList } from './FriendsList';
import { EmptyFriendsState } from './EmptyFriendsState';
import { ModernLoadingOverlay } from './ModernLoadingOverlay';
import { useLcryptDataManager } from '@/hooks/useLcryptDataManager';
import { useFriendsAutoUpdate } from '@/hooks/useFriendsAutoUpdate';
import { useFlashingPlayer } from '@/hooks/useFlashingPlayer';

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onUpdateFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
  onReloadFriends: () => void;
}

export const FriendsSection = ({
  friends,
  onAddFriend,
  onUpdateFriend,
  onRemoveFriend,
  onShowPlayerDetails,
  onReloadFriends
}: FriendsSectionProps) => {
  const { flashingPlayer } = useFlashingPlayer();
  
  // Use Lcrypt data manager for ELO loading (separate from Supabase updates)
  const { 
    friendsWithLcrypt, 
    isLoading: isLoadingElo, 
    loadingProgress,
    reloadData: reloadEloData 
  } = useLcryptDataManager({
    friends,
    enabled: true
  });

  // Use auto update for Faceit data only (not ELO)
  const { isUpdating, updateAllFriends } = useFriendsAutoUpdate({
    friends,
    updateFriend: onUpdateFriend,
    reloadFriends: onReloadFriends,
    enabled: true
  });

  const handleRefreshAll = async () => {
    console.log('🔄 Manual refresh triggered');
    await updateAllFriends();
    await reloadEloData();
  };

  if (friends.length === 0) {
    return <EmptyFriendsState />;
  }

  return (
    <div className="space-y-4 relative">
      <FriendsSectionHeader 
        friendsCount={friends.length}
        onUpdateAll={handleRefreshAll}
        isUpdating={isUpdating}
      />
      
      <FriendsList 
        friends={friendsWithLcrypt}
        flashingPlayer={flashingPlayer}
        onPlayerClick={onShowPlayerDetails}
      />
      
      {/* Show loading overlay only for general Faceit updates */}
      {isUpdating && (
        <ModernLoadingOverlay 
          isLoading={isUpdating}
          progress={0}
          friendsCount={friends.length}
        />
      )}
      
      {/* Show ELO loading progress */}
      {isLoadingElo && (
        <div className="fixed bottom-4 right-4 bg-[#2a2f36] border border-[#ff6500]/30 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#ff6500] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white text-sm">
              Se încarcă datele ELO... {Math.round(loadingProgress)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
