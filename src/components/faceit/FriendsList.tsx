
import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';
import { LiveStream } from '@/types/streaming';


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
  streamingFriends: Map<string, LiveStream>;
  onPlayerClick: (player: Player) => void;
}

export const FriendsList = React.memo(({ 
  friends, 
  flashingPlayer, 
  loadingFriends,
  liveMatches,
  streamingFriends,
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


  return (
    <div className="relative space-y-3 px-1">

      {/* All Friends in Rank Order */}
      {sortedFriends.map((friend, index) => {
        const liveInfo = liveMatches[friend.player_id];
        const isStreaming = streamingFriends.has(friend.nickname.toLowerCase());
        return (
          <FriendListItem
            key={friend.player_id}
            friend={friend}
            index={index}
            isFlashing={flashingPlayer === friend.player_id}
            isLoadingElo={loadingFriends.has(friend.nickname)}
            isLive={liveInfo?.isLive || false}
            isStreaming={isStreaming}
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
