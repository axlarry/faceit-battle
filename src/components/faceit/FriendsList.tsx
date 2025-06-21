
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
  // Sort friends by ELO, cu jucătorii live la început
  const sortedFriends = React.useMemo(() => {
    return [...friends].sort((a, b) => {
      // Jucătorii live vin primii
      const aIsLive = liveMatches[a.player_id]?.isLive || false;
      const bIsLive = liveMatches[b.player_id]?.isLive || false;
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Apoi sortare după ELO
      return (b.elo || 0) - (a.elo || 0);
    });
  }, [friends, liveMatches]);

  return (
    <div className="space-y-2">
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
