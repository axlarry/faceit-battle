
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';

interface FriendsWithLcrypt extends Player {
  lcryptData?: any;
}

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  matchDetails?: any;
}

interface FriendsListProps {
  friends: FriendsWithLcrypt[];
  flashingPlayer: string | null;
  loadingFriends: Set<string>;
  liveMatches: Record<string, LiveMatchInfo>;
  onPlayerClick: (player: Player) => void;
}

export const FriendsList = React.memo(({ 
  friends, 
  flashingPlayer, 
  loadingFriends,
  liveMatches,
  onPlayerClick 
}: FriendsListProps) => {
  // Sortează prietenii: live players first, apoi după ELO
  const sortedFriends = React.useMemo(() => {
    const liveFriends: FriendsWithLcrypt[] = [];
    const otherFriends: FriendsWithLcrypt[] = [];

    friends.forEach(friend => {
      const liveInfo = liveMatches[friend.player_id];
      if (liveInfo?.isLive) {
        liveFriends.push(friend);
      } else {
        otherFriends.push(friend);
      }
    });

    // Sortează grupurile
    const sortedLive = liveFriends.sort((a, b) => (b.elo || 0) - (a.elo || 0));
    const sortedOthers = otherFriends.sort((a, b) => (b.elo || 0) - (a.elo || 0));

    return [...sortedLive, ...sortedOthers];
  }, [friends, liveMatches]);

  return (
    <div className="space-y-2 px-1">
      {sortedFriends.map((friend, index) => {
        const liveInfo = liveMatches[friend.player_id];
        return (
          <FriendListItem
            key={friend.player_id}
            friend={friend}
            index={index}
            isFlashing={flashingPlayer === friend.player_id}
            isLoadingElo={loadingFriends.has(friend.nickname)}
            isLive={liveInfo?.isLive || false}
            liveCompetition={liveInfo?.competition}
            liveMatchDetails={liveInfo?.matchDetails}
            onPlayerClick={onPlayerClick}
          />
        );
      })}
    </div>
  );
});

FriendsList.displayName = 'FriendsList';
