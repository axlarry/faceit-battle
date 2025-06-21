
import React from 'react';
import { Player } from "@/types/Player";
import { FriendAvatar } from './FriendAvatar';
import { FriendInfo } from './FriendInfo';
import { FriendStats } from './FriendStats';
import { FriendActions } from './FriendActions';
import { useSteamIdConverter } from './SteamIdConverter';
import { LoaderCircle, Radio, Play, Clock, MapPin } from 'lucide-react';

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

  // Enhanced live styles with modern gradients and animations
  const liveStyles = isLive ? {
    border: 'border-green-400/60',
    background: 'from-green-500/20 via-emerald-600/10 to-green-500/20',
    glow: 'shadow-lg shadow-green-500/30',
    pulse: 'animate-pulse'
  } : {
    border: 'border-gray-600/30',
    background: 'from-gray-800 via-gray-900 to-gray-800',
    glow: 'shadow-gray-900/50',
    pulse: ''
  };

  return (
    <div
      onClick={handleClick}
      className={`relative bg-gradient-to-br ${liveStyles.background} rounded-xl p-3 border-2 ${liveStyles.border} hover:border-orange-500/50 transition-all duration-300 shadow-lg ${liveStyles.glow} cursor-pointer transform hover:scale-[1.02] ${
        isFlashing ? 'animate-pulse bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-orange-500/20 border-orange-500' : ''
      } ${liveStyles.pulse}`}
    >
      {/* Live Match Header - Only visible when live */}
      {isLive && (
        <div className="absolute -top-2 left-4 right-4 z-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 shadow-lg animate-pulse">
            <Radio className="w-3 h-3" />
            <span>LIVE MATCH</span>
            <Play className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Loading Overlay pentru ELO */}
      {isLoadingElo && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="w-8 h-8 text-orange-400 animate-spin" />
            <span className="text-xs text-orange-400 font-medium">Se încarcă ELO...</span>
          </div>
        </div>
      )}

      {/* Main Content with adjusted padding for live indicator */}
      <div className={`flex items-center gap-3 ${isLive ? 'pt-3' : ''}`}>
        {/* Avatar and Rank */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-lg font-bold text-[#ff6500] min-w-[2rem] text-center">
            #{index + 1}
          </div>
          <div className="relative">
            <img
              src={friend.avatar}
              alt={friend.nickname}
              className={`w-12 h-12 rounded-lg border-2 ${isLive ? 'border-green-400 ring-2 ring-green-500/50' : 'border-[#ff6500]'} shadow-lg flex-shrink-0`}
            />
            {isLive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
            )}
          </div>
        </div>

        {/* Player Info - Enhanced for live matches */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            {/* Nickname with live indicator */}
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white truncate">{friend.nickname}</h3>
              {isLive && (
                <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
              )}
            </div>
            
            {/* ELO and Level Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <FriendInfo
                nickname={friend.nickname}
                level={friend.level}
                elo={friend.elo}
                lcryptData={friend.lcryptData}
              />
            </div>

            {/* Live Match Details - Enhanced Modern Design */}
            {isLive && liveMatchDetails && (
              <div className="mt-2 p-3 bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-green-900/30 rounded-lg border border-green-500/40 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 font-medium truncate">
                      {liveMatchDetails.map || 'Hartă Necunoscută'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 font-bold">LIVE</span>
                  </div>
                </div>
                
                {(liveMatchDetails.score || liveMatchDetails.result) && (
                  <div className="flex items-center justify-center gap-3 text-sm mt-2 pt-2 border-t border-green-500/20">
                    {liveMatchDetails.score && (
                      <div className="bg-gray-800/50 px-3 py-1 rounded-full border border-green-500/30">
                        <span className="text-white font-bold">{liveMatchDetails.score}</span>
                      </div>
                    )}
                    {liveMatchDetails.result && (
                      <div className={`px-3 py-1 rounded-full border font-medium capitalize text-xs ${
                        liveMatchDetails.result === 'winning' ? 'text-green-300 bg-green-500/20 border-green-500/40' : 
                        liveMatchDetails.result === 'losing' ? 'text-red-300 bg-red-500/20 border-red-500/40' : 
                        'text-yellow-300 bg-yellow-500/20 border-yellow-500/40'
                      }`}>
                        {liveMatchDetails.result}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stats Row - Compact Layout */}
            <div className="flex items-center justify-between gap-2 mt-2">
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

              {/* Actions - Enhanced for live matches */}
              <div className="flex gap-1" onClick={handleLinkClick}>
                <a
                  href={`https://www.faceit.com/en/players/${friend.nickname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-transparent border text-xs transition-all duration-200 rounded-lg w-8 h-8 flex items-center justify-center ${
                    isLive 
                      ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-white shadow-green-400/20 shadow-md' 
                      : 'border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white'
                  }`}
                >
                  <img 
                    src="/faceit-icons/faceit_icon.png" 
                    alt="F" 
                    className="w-4 h-4"
                    onError={(e) => {
                      console.log('Faceit icon failed to load, using fallback');
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <span className="text-xs font-bold hidden">F</span>
                </a>
                <a
                  href={steamId64 ? `https://steamcommunity.com/profiles/${steamId64}` : `https://steamcommunity.com/search/users/#text=${friend.nickname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-transparent border text-xs transition-all duration-200 rounded-lg w-8 h-8 flex items-center justify-center ${
                    isLive 
                      ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-white shadow-green-400/20 shadow-md' 
                      : 'border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white'
                  }`}
                >
                  <img 
                    src="/faceit-icons/steam_icon.png" 
                    alt="S" 
                    className="w-4 h-4"
                    onError={(e) => {
                      console.log('Steam icon failed to load, using fallback');
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <span className="text-xs font-bold hidden">S</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
