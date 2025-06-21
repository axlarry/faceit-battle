
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

  // Stiluri pentru jucătorii live
  const liveStyles = isLive ? {
    border: 'border-green-400/50',
    background: 'from-green-900/20 via-gray-800 to-gray-900',
    glow: 'shadow-green-500/20'
  } : {
    border: 'border-gray-600/30',
    background: 'from-gray-800 via-gray-900 to-gray-800',
    glow: 'shadow-gray-900/50'
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-gradient-to-br ${liveStyles.background} rounded-xl p-3 md:p-4 border-2 ${liveStyles.border} hover:border-orange-500/50 transition-all duration-300 shadow-lg ${liveStyles.glow} cursor-pointer transform hover:scale-[1.02] relative ${
        isFlashing ? 'animate-pulse bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-orange-500/20 border-orange-500' : ''
      } ${hasNoEloData ? 'blur-sm opacity-70' : ''}`}
    >
      <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {/* Mobile Layout - Stacked */}
        <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
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
            
            {/* Live Match Details - Mobile Optimized */}
            {isLive && liveMatchDetails && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs md:text-sm">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold animate-pulse">
                    {liveMatchDetails.status || 'LIVE'}
                  </span>
                  <span className="text-green-400 font-medium truncate">
                    {liveMatchDetails.map || 'Hartă Necunoscută'}
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs">
                  {liveMatchDetails.score && (
                    <span className="text-white font-bold bg-gray-700/50 px-2 py-1 rounded">
                      {liveMatchDetails.score}
                    </span>
                  )}
                  {liveMatchDetails.result && (
                    <span className={`font-medium capitalize px-2 py-1 rounded ${
                      liveMatchDetails.result === 'winning' ? 'text-green-400 bg-green-500/20' : 
                      liveMatchDetails.result === 'losing' ? 'text-red-400 bg-red-500/20' : 'text-yellow-400 bg-yellow-500/20'
                    }`}>
                      {liveMatchDetails.result}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats and Actions - Mobile Optimized */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto">
          <div className="grid grid-cols-2 lg:flex lg:gap-3 gap-2 text-xs md:text-sm">
            <FriendStats
              wins={friend.wins}
              winRate={friend.winRate}
              hsRate={friend.hsRate}
              kdRatio={friend.kdRatio}
            />
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <FriendActions
              nickname={friend.nickname}
              steamId64={steamId64}
              onLinkClick={handleLinkClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
