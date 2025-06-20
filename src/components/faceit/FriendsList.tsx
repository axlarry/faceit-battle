
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';

interface FriendsWithLcrypt extends Player {
  lcryptData?: any;
}

interface FriendsListProps {
  friends: FriendsWithLcrypt[];
  flashingPlayer: string | null;
  loadingFriends: Set<string>;
  livePlayerChecker?: {
    isPlayerLive: (playerId: string) => boolean;
    getPlayerMatchData: (playerId: string) => any;
  };
  onPlayerClick: (player: Player) => void;
}

export const FriendsList = React.memo(({ 
  friends, 
  flashingPlayer, 
  loadingFriends,
  livePlayerChecker,
  onPlayerClick 
}: FriendsListProps) => {
  // Sort friends by ELO
  const sortedFriends = React.useMemo(() => {
    return [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
  }, [friends]);

  return (
    <div className="space-y-2">
      {sortedFriends.map((friend, index) => (
        <FriendListItem
          key={friend.player_id}
          friend={friend}
          index={index}
          isFlashing={flashingPlayer === friend.player_id}
          isLoadingElo={loadingFriends.has(friend.nickname)}
          isLive={livePlayerChecker?.isPlayerLive(friend.player_id) || false}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  );
});

FriendsList.displayName = 'FriendsList';
