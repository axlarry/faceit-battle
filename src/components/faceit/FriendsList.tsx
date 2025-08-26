
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';
import { LiveMatchGroup } from './LiveMatchGroup';

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
  // Grupează prietenii după match-uri live și sortează restul după ELO
  const { liveMatchGroups, otherFriends } = React.useMemo(() => {
    const liveGroups: Record<string, FriendsWithLcrypt[]> = {};
    const others: FriendsWithLcrypt[] = [];

    friends.forEach(friend => {
      const liveInfo = liveMatches[friend.player_id];
      if (liveInfo?.isLive && liveInfo.matchId) {
        if (!liveGroups[liveInfo.matchId]) {
          liveGroups[liveInfo.matchId] = [];
        }
        liveGroups[liveInfo.matchId].push(friend);
      } else {
        others.push(friend);
      }
    });

    // Sortează prietenii care nu sunt live după ELO
    const sortedOthers = others.sort((a, b) => (b.elo || 0) - (a.elo || 0));

    return {
      liveMatchGroups: Object.entries(liveGroups).filter(([_, players]) => players.length > 0),
      otherFriends: sortedOthers
    };
  }, [friends, liveMatches]);

  return (
    <div className="space-y-2 px-1">
      {/* Grupuri de match-uri live */}
      {liveMatchGroups.map(([matchId, players]) => (
        <LiveMatchGroup
          key={matchId}
          matchId={matchId}
          players={players}
          liveMatches={liveMatches}
          flashingPlayer={flashingPlayer}
          loadingFriends={loadingFriends}
          onPlayerClick={onPlayerClick}
        />
      ))}

      {/* Prietenii care nu sunt live */}
      {otherFriends.map((friend, index) => {
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
