
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';

interface FriendsWithLcrypt extends Player {
  lcryptData?: any;
}

interface FriendsListProps {
  friends: FriendsWithLcrypt[];
  flashingPlayer: string | null;
  onPlayerClick: (player: Player) => void;
}

export const FriendsList = React.memo(({ 
  friends, 
  flashingPlayer, 
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
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  );
});

FriendsList.displayName = 'FriendsList';
