
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
  liveMatchDetails?: any;
  onPlayerClick: (player: Player) => void;
}

export const FriendListItem = React.memo(({ 
  friend, 
  index, 
  isFlashing, 
  isLoadingElo,
  isLive = false,
  liveCompetition,
  liveMatchDetails,
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

  // Stiluri pentru jucătorii live - fără animație, doar culoare diferită
  const liveStyles = isLive ? {
    border: 'border-green-500',
    background: 'bg-green-500/10'
  } : {
    border: 'border-[#3a4048]',
    background: 'bg-[#2a2f36]'
  };

  return (
    <div
      onClick={handleClick}
      className={`${liveStyles.background} rounded-lg p-2 sm:p-3 border-2 ${liveStyles.border} hover:border-[#ff6500]/50 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.01] relative ${
        isFlashing ? 'animate-pulse bg-[#ff6500]/20 border-[#ff6500]' : ''
      } ${hasNoEloData ? 'blur-sm opacity-70' : ''}`}
    >
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
          <FriendAvatar 
            avatar={friend.avatar}
            nickname={friend.nickname}
            index={index}
          />
          
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FriendInfo
                nickname={friend.nickname}
                level={friend.level}
                elo={friend.elo}
                lcryptData={friend.lcryptData}
              />
            </div>
            
            {/* Live Match Details - centrat și fără animație */}
            {isLive && liveMatchDetails && (
              <div className="mt-2 space-y-1 flex flex-col items-center text-center">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {liveMatchDetails.status || 'LIVE'}
                  </span>
                  <span className="text-green-400 font-medium">
                    {liveMatchDetails.map || 'Unknown Map'}
                  </span>
                  <span className="text-gray-300 text-xs">
                    ({liveMatchDetails.server || 'Unknown Server'})
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-3 text-sm">
                  {liveMatchDetails.score && (
                    <span className="text-white font-bold">
                      Score: {liveMatchDetails.score}
                    </span>
                  )}
                  {liveMatchDetails.result && (
                    <span className={`font-medium capitalize ${
                      liveMatchDetails.result === 'winning' ? 'text-green-400' : 
                      liveMatchDetails.result === 'losing' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {liveMatchDetails.result}
                    </span>
                  )}
                  {liveMatchDetails.duration && (
                    <span className="text-gray-400 text-xs">
                      {liveMatchDetails.duration}
                    </span>
                  )}
                </div>
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
