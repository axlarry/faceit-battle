
import React from 'react';
import { Player } from "@/types/Player";
import { FriendAvatar } from './FriendAvatar';
import { FriendInfo } from './FriendInfo';
import { FriendStats } from './FriendStats';
import { FriendActions } from './FriendActions';
import { useSteamIdConverter } from './SteamIdConverter';
import { LoaderCircle } from 'lucide-react';

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
      className={`bg-gradient-to-br ${liveStyles.background} rounded-xl p-3 border-2 ${liveStyles.border} hover:border-orange-500/50 transition-all duration-300 shadow-lg ${liveStyles.glow} cursor-pointer transform hover:scale-[1.02] relative ${
        isFlashing ? 'animate-pulse bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-orange-500/20 border-orange-500' : ''
      }`}
    >
      {/* Loading Overlay pentru ELO */}
      {isLoadingElo && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="w-8 h-8 text-orange-400 animate-spin" />
            <span className="text-xs text-orange-400 font-medium">Se încarcă ELO...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center gap-3">
        {/* Avatar and Rank */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-lg font-bold text-[#ff6500] min-w-[2rem] text-center">
            #{index + 1}
          </div>
          <img
            src={friend.avatar}
            alt={friend.nickname}
            className="w-12 h-12 rounded-lg border-2 border-[#ff6500] shadow-lg flex-shrink-0"
          />
        </div>

        {/* Player Info - Mobile Optimized */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            {/* Nickname */}
            <h3 className="text-base font-bold text-white truncate">{friend.nickname}</h3>
            
            {/* ELO and Level Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <FriendInfo
                nickname={friend.nickname}
                level={friend.level}
                elo={friend.elo}
                lcryptData={friend.lcryptData}
              />
            </div>

            {/* Stats Row - Compact Mobile Layout */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex gap-3 text-xs">
                <div className="text-center">
                  <div className="text-white font-bold">{friend.wins}</div>
                  <div className="text-gray-400">W</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{friend.winRate}%</div>
                  <div className="text-gray-400">WR</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{friend.hsRate}%</div>
                  <div className="text-gray-400">HS</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{friend.kdRatio}</div>
                  <div className="text-gray-400">K/D</div>
                </div>
              </div>

              {/* Actions - Fixed icon display */}
              <div className="flex gap-1" onClick={handleLinkClick}>
                <a
                  href={`https://www.faceit.com/en/players/${friend.nickname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-transparent border border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-xs transition-colors"
                >
                  <img 
                    src="/faceit-icons/faceit_icon.png" 
                    alt="F" 
                    className="w-4 h-4"
                    onError={(e) => {
                      console.log('Faceit icon failed to load, using fallback');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-xs font-bold hidden">F</span>
                </a>
                <a
                  href={steamId64 ? `https://steamcommunity.com/profiles/${steamId64}` : `https://steamcommunity.com/search/users/#text=${friend.nickname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-xs transition-colors"
                >
                  <img 
                    src="/faceit-icons/steam_icon.png" 
                    alt="S" 
                    className="w-4 h-4"
                    onError={(e) => {
                      console.log('Steam icon failed to load, using fallback');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-xs font-bold hidden">S</span>
                </a>
              </div>
            </div>

            {/* Live Match Details - Mobile Optimized */}
            {isLive && liveMatchDetails && (
              <div className="mt-2 p-2 bg-green-900/20 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    {liveMatchDetails.status || 'LIVE'}
                  </span>
                  <span className="text-green-400 font-medium truncate">
                    {liveMatchDetails.map || 'Hartă Necunoscută'}
                  </span>
                </div>
                
                {(liveMatchDetails.score || liveMatchDetails.result) && (
                  <div className="flex items-center justify-center gap-2 text-xs mt-1">
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
