// V2.0 Virtualized Friends List for better performance with large lists
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  matchDetails?: any;
}

interface VirtualizedFriendsListProps {
  friends: FriendWithLcrypt[];
  flashingPlayer: string | null;
  loadingFriends: Set<string>;
  liveMatches: Record<string, LiveMatchInfo>;
  onPlayerClick: (player: Player) => void;
  height?: number;
  itemHeight?: number;
}

interface ItemData {
  friends: FriendWithLcrypt[];
  flashingPlayer: string | null;
  loadingFriends: Set<string>;
  liveMatches: Record<string, LiveMatchInfo>;
  onPlayerClick: (player: Player) => void;
}

const FriendItem = React.memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) => {
  const { friends, flashingPlayer, loadingFriends, liveMatches, onPlayerClick } = data;
  const friend = friends[index];
  
  if (!friend) return null;
  
  const liveInfo = liveMatches[friend.player_id];
  
  return (
    <div style={{ ...style, padding: '4px 0' }}>
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
    </div>
  );
});

FriendItem.displayName = 'VirtualizedFriendItem';

export const VirtualizedFriendsList = React.memo(({
  friends,
  flashingPlayer,
  loadingFriends,
  liveMatches,
  onPlayerClick,
  height = 600,
  itemHeight = 200
}: VirtualizedFriendsListProps) => {
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo((): ItemData => ({
    friends,
    flashingPlayer,
    loadingFriends,
    liveMatches,
    onPlayerClick
  }), [friends, flashingPlayer, loadingFriends, liveMatches, onPlayerClick]);

  // Auto-calculate height based on content
  const calculatedHeight = Math.min(height, friends.length * itemHeight);
  
  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No friends to display
      </div>
    );
  }

  // For small lists, render normally to avoid virtualization overhead
  if (friends.length <= 10) {
    return (
      <div className="space-y-2 px-1">
        {friends.map((friend, index) => {
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
  }

  return (
    <div className="px-1">
      <List
        height={calculatedHeight}
        width="100%"
        itemCount={friends.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render extra items for smooth scrolling
        className="scrollbar-hide"
      >
        {FriendItem}
      </List>
    </div>
  );
});

VirtualizedFriendsList.displayName = 'VirtualizedFriendsList';