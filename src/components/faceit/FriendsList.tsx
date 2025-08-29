
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';
import { groupLivePlayersByTeam } from '@/utils/teamGroupingUtils';
import { TeamConnectionOverlay } from './TeamConnectionOverlay';

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
  // Sort friends by ELO in descending order (highest first)
  const sortedFriends = React.useMemo(() => {
    return [...friends].sort((a, b) => {
      const eloA = a.lcryptData?.elo || a.elo || 0;
      const eloB = b.lcryptData?.elo || b.elo || 0;
      return eloB - eloA;
    });
  }, [friends]);

  // Group live players by teams for connection lines
  const liveTeams = React.useMemo(() => {
    const liveFriends = sortedFriends.filter(friend => 
      liveMatches[friend.player_id]?.isLive
    );
    return groupLivePlayersByTeam(liveFriends, liveMatches);
  }, [sortedFriends, liveMatches]);

  return (
    <div className="relative space-y-3 px-1">
      {/* Team Connection Lines Overlay */}
      <TeamConnectionOverlay teams={liveTeams} />

      {/* All Friends in Rank Order */}
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
