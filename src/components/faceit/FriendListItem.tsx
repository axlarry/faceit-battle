import React from 'react';
import { Player } from "@/types/Player";
import { useSteamIdConverter } from './SteamIdConverter';
import { LoaderCircle, Zap, Crown } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerInfo } from './PlayerInfo';
import { PlayerStatsCompact } from './PlayerStatsCompact';
import { PlayerActionsCompact } from './PlayerActionsCompact';
import { LiveMatchDetails } from './LiveMatchDetails';
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
  const {
    steamId64
  } = useSteamIdConverter(friend.player_id);
  const handleClick = () => {
    onPlayerClick(friend);
  };
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Modern styling system
  const getPlayerStyles = () => {
    if (isLive) {
      return {
        border: 'border-emerald-400/60',
        background: 'from-emerald-600/20 via-green-500/10 to-emerald-600/20',
        glow: 'shadow-2xl shadow-emerald-500/40',
        accent: 'emerald',
        pulseColor: 'bg-emerald-400'
      };
    }

    // Top 3 players get special treatment
    if (index === 0) {
      return {
        border: 'border-yellow-400/70',
        background: 'from-yellow-600/25 via-amber-500/15 to-yellow-600/25',
        glow: 'shadow-2xl shadow-yellow-500/50',
        accent: 'yellow',
        pulseColor: 'bg-yellow-400'
      };
    } else if (index === 1) {
      return {
        border: 'border-gray-300/60',
        background: 'from-gray-400/20 via-slate-300/10 to-gray-400/20',
        glow: 'shadow-xl shadow-gray-400/40',
        accent: 'gray',
        pulseColor: 'bg-gray-300'
      };
    } else if (index === 2) {
      return {
        border: 'border-orange-400/60',
        background: 'from-orange-600/20 via-amber-600/10 to-orange-600/20',
        glow: 'shadow-xl shadow-orange-500/40',
        accent: 'orange',
        pulseColor: 'bg-orange-400'
      };
    }
    return {
      border: 'border-slate-600/40',
      background: 'from-slate-700/30 via-slate-800/20 to-slate-700/30',
      glow: 'shadow-lg shadow-slate-900/60',
      accent: 'slate',
      pulseColor: 'bg-slate-400'
    };
  };
  const playerStyles = getPlayerStyles();
  const shouldShowLoadingOverlay = friend.lcryptData === undefined && isLoadingElo;

  // Enhanced background with 3D depth
  const backgroundStyle = friend.cover_image ? {
    backgroundImage: `
      linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.8) 100%),
      url(${friend.cover_image})
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};
  return <div className="relative group" style={{
    animationDelay: `${index * 100}ms`
  }}>
      {/* Outer glow effect */}
      <div className={`absolute inset-0 rounded-3xl ${playerStyles.glow} opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl scale-105`}></div>
      
      <div onClick={handleClick} className={`
          relative rounded-3xl p-5 border-2 ${playerStyles.border} 
          hover:border-white/50 transition-all duration-700 cursor-pointer
          transform hover:scale-[1.03] hover:-translate-y-2
          backdrop-blur-xl overflow-hidden
          ${isFlashing ? 'animate-pulse border-orange-400 bg-gradient-to-br from-orange-500/30 via-red-500/20 to-orange-500/30' : ''}
          ${!friend.cover_image ? `bg-gradient-to-br ${playerStyles.background}` : ''}
        `} style={friend.cover_image ? backgroundStyle : {}}>
        {/* 3D depth layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5 rounded-3xl"></div>
        
        {/* Rank indicator */}
        <div className="absolute top-4 left-4 z-20">
          {index < 3 && <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${playerStyles.pulseColor} rounded-full animate-pulse shadow-lg`}>
              <div className={`absolute inset-0 ${playerStyles.pulseColor} rounded-full animate-ping`}></div>
            </div>}
        </div>

        {/* Animated Crown for #1 Player */}
        {index === 0 && <div className="absolute top-2 right-2 z-30">
            <div className="relative">
              <Crown size={32} className="text-yellow-400 animate-bounce drop-shadow-lg" style={{
            filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))',
            animationDuration: '2s'
          }} />
              {/* Glowing effect around crown */}
              <div className="absolute inset-0 -m-2">
                <Crown size={36} className="text-yellow-400/30 animate-pulse" />
              </div>
            </div>
          </div>}

        {/* Live indicator */}
        {isLive && <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 rounded-full border border-red-400/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-red-200 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">LIVE</span>
              <Zap size={12} className="text-red-200 animate-bounce" />
            </div>
          </div>}

        {/* Loading overlay */}
        {shouldShowLoadingOverlay && <div className="absolute inset-0 bg-slate-900/95 rounded-3xl flex items-center justify-center z-30 backdrop-blur-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700/30"></div>
                <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                <LoaderCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-400 animate-pulse" size={20} />
              </div>
              <div className="text-center">
                <span className="text-sm text-orange-400 font-semibold block">Loading Player Data</span>
                <span className="text-xs text-slate-400 font-medium">{friend.nickname}</span>
              </div>
            </div>
          </div>}

        {/* Enhanced background overlay for readability */}
        {friend.cover_image && <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 rounded-3xl"></div>}

        {/* Main content */}
        <div className="flex items-center gap-4 relative z-10 mb-3">
          {/* Avatar */}
          <div className="relative">
            <PlayerAvatar avatar={friend.avatar} nickname={friend.nickname} index={index} isLive={isLive} />
            {/* Performance indicator */}
            {friend.elo && friend.elo > 2000}
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <PlayerInfo nickname={friend.nickname} level={friend.level} elo={friend.elo} lcryptData={friend.lcryptData} isLive={isLive} />
          </div>
        </div>

        {/* Live Match Details */}
        <LiveMatchDetails isLive={isLive} liveMatchDetails={liveMatchDetails} />

        {/* Stats and actions row */}
        <div className="flex items-center justify-between gap-3 mt-4 relative z-10">
          <div className="flex-1">
            <PlayerStatsCompact wins={friend.wins || 0} winRate={friend.winRate || 0} hsRate={friend.hsRate || 0} kdRatio={friend.kdRatio || 0} />
          </div>

          <PlayerActionsCompact nickname={friend.nickname} steamId64={steamId64} isLive={isLive} onLinkClick={handleLinkClick} />
        </div>

        {/* Advanced shine effects */}
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1200 rounded-3xl"></div>
        <div className="absolute inset-0 -skew-x-6 bg-gradient-to-r from-transparent via-purple-300/5 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-800 delay-300 rounded-3xl"></div>
        
        {/* Floating particles for top players */}
        {index < 3 && <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(3)].map((_, i) => <div key={i} className={`absolute w-1 h-1 bg-${playerStyles.accent}-400/60 rounded-full`} style={{
          left: `${20 + i * 30}%`,
          top: `${30 + i % 2 * 40}%`,
          animationDelay: `${i * 1.5}s`,
          animationDuration: `${4 + i}s`
        }} />)}
          </div>}
      </div>
    </div>;
});
FriendListItem.displayName = 'FriendListItem';