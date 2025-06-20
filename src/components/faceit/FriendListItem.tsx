
import React from 'react';
import { Player } from "@/types/Player";
import { FriendAvatar } from './FriendAvatar';
import { FriendInfo } from './FriendInfo';
import { FriendStats } from './FriendStats';
import { FriendActions } from './FriendActions';
import { useSteamIdConverter } from './SteamIdConverter';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface FriendListItemProps {
  friend: FriendWithLcrypt;
  index: number;
  isFlashing: boolean;
  isLoadingElo: boolean;
  isLive?: boolean;
  onPlayerClick: (player: Player) => void;
}

export const FriendListItem = React.memo(({ 
  friend, 
  index, 
  isFlashing, 
  isLoadingElo,
  isLive = false,
  onPlayerClick 
}: FriendListItemProps) => {
  const { steamId64 } = useSteamIdConverter(friend.player_id);

  const handleClick = () => {
    onPlayerClick(friend);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determină dacă jucătorul nu are date ELO încărcate
  const hasNoEloData = !friend.lcryptData || !friend.elo;

  return (
    <div
      onClick={handleClick}
      className={`bg-[#2a2f36] rounded-lg p-2 sm:p-3 border transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.01] relative ${
        isLive 
          ? 'border-green-500 animate-pulse shadow-green-500/20' 
          : isFlashing 
            ? 'animate-pulse bg-[#ff6500]/20 border-[#ff6500]' 
            : 'border-[#3a4048] hover:border-[#ff6500]/50'
      } ${hasNoEloData ? 'blur-sm opacity-70' : ''}`}
    >
      {isLive && (
        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
          Live On Match
        </div>
      )}
      
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
          <FriendAvatar 
            avatar={friend.avatar}
            nickname={friend.nickname}
            index={index}
          />
          
          <FriendInfo
            nickname={friend.nickname}
            level={friend.level}
            elo={friend.elo}
            lcryptData={friend.lcryptData}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm w-full sm:w-auto justify-between sm:justify-end">
          <FriendStats
            wins={friend.wins}
            winRate={friend.winRate}
            hsRate={friend.hsRate}
            kdRatio={friend.kdRatio}
          />
          
          <FriendActions
            nickname={friend.nickname}
            steamId64={steamId64}
            onLinkClick={handleLinkClick}
          />
        </div>
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
