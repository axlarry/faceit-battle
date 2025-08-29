
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';
import { groupLivePlayersByTeam } from '@/utils/teamGroupingUtils';
import { TeamConnectedView } from './TeamConnectedView';

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

  // Group live players by teams
  const liveTeams = React.useMemo(() => {
    const liveFriends = sortedFriends.filter(friend => 
      liveMatches[friend.player_id]?.isLive
    );
    return groupLivePlayersByTeam(liveFriends, liveMatches);
  }, [sortedFriends, liveMatches]);

  // Get non-live friends and live friends not in teams
  const { nonLiveFriends, soloLiveFriends } = React.useMemo(() => {
    const teamPlayerIds = new Set(
      liveTeams.flatMap(team => team.players.map(p => p.player_id))
    );
    
    const nonLive = sortedFriends.filter(friend => 
      !liveMatches[friend.player_id]?.isLive
    );
    
    const soloLive = sortedFriends.filter(friend => 
      liveMatches[friend.player_id]?.isLive && !teamPlayerIds.has(friend.player_id)
    );

    return { 
      nonLiveFriends: nonLive, 
      soloLiveFriends: soloLive 
    };
  }, [sortedFriends, liveMatches, liveTeams]);

  return (
    <div className="space-y-3 px-1">
      {/* Live Teams with Connected Lines */}
      {liveTeams.map((team) => (
        <TeamConnectedView
          key={team.id}
          team={team}
          flashingPlayer={flashingPlayer}
          loadingFriends={loadingFriends}
          liveMatches={liveMatches}
          onPlayerClick={onPlayerClick}
        />
      ))}

      {/* Solo Live Players */}
      {soloLiveFriends.map((friend, index) => {
        const liveInfo = liveMatches[friend.player_id];
        return (
          <FriendListItem
            key={friend.player_id}
            friend={friend}
            index={-1} // No special styling for solo live
            isFlashing={flashingPlayer === friend.player_id}
            isLoadingElo={loadingFriends.has(friend.nickname)}
            isLive={liveInfo?.isLive || false}
            liveCompetition={liveInfo?.competition}
            liveMatchDetails={liveInfo?.matchDetails}
            onPlayerClick={onPlayerClick}
          />
        );
      })}

      {/* Non-Live Friends */}
      {nonLiveFriends.map((friend, index) => {
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
