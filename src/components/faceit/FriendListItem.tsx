
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
  liveCompetition?: string;
  onPlayerClick: (player: Player) => void;
}

export const FriendListItem = React.memo(({ 
  friend, 
  index, 
  isFlashing, 
  isLoadingElo,
  isLive = false,
  liveCompetition,
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

  // Stiluri pentru jucătorii live
  const liveStyles = isLive ? {
    border: 'border-green-500',
    animation: 'animate-pulse',
    background: 'bg-green-500/10'
  } : {
    border: 'border-[#3a4048]',
    animation: '',
    background: 'bg-[#2a2f36]'
  };

  return (
    <div
      onClick={handleClick}
      className={`${liveStyles.background} rounded-lg p-2 sm:p-3 border-2 ${liveStyles.border} hover:border-[#ff6500]/50 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.01] relative ${
        isFlashing ? 'animate-pulse bg-[#ff6500]/20 border-[#ff6500]' : ''
      } ${hasNoEloData ? 'blur-sm opacity-70' : ''} ${liveStyles.animation}`}
    >
      {/* Live Match Indicator */}
      {isLive && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
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
          
          <div className="flex flex-col min-w-0">
            <FriendInfo
              nickname={friend.nickname}
              level={friend.level}
              elo={friend.elo}
              lcryptData={friend.lcryptData}
            />
            {isLive && liveCompetition && (
              <div className="text-xs text-green-400 mt-1 truncate">
                {liveCompetition}
              </div>
            )}
          </div>
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
