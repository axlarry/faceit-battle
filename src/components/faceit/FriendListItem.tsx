
import React from 'react';
import { Player } from "@/types/Player";
import { useSteamIdConverter } from './SteamIdConverter';
import { LoaderCircle } from 'lucide-react';
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
  const { steamId64 } = useSteamIdConverter(friend.player_id);

  const handleClick = () => {
    onPlayerClick(friend);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Styles pentru toți playerii - fără diferențiere specială pentru primul loc
  const getPlayerStyles = () => {
    if (isLive) {
      return {
        border: 'border-green-400/60',
        background: 'from-green-500/20 via-emerald-600/10 to-green-500/20',
        glow: 'shadow-lg shadow-green-500/30',
        animation: '',
        ring: '',
        transform: ''
      };
    }
    
    return {
      border: 'border-gray-600/30',
      background: 'from-gray-800 via-gray-900 to-gray-800',
      glow: 'shadow-gray-900/50',
      animation: '',
      ring: '',
      transform: ''
    };
  };

  const playerStyles = getPlayerStyles();
  
  // Loading overlay DOAR pentru încărcarea inițială și actualizarea manuală
  // Nu pentru actualizările individuale în fundal
  const shouldShowLoadingOverlay = (friend.lcryptData === undefined && isLoadingElo);

  // Create background style with cover image
  const backgroundStyle = friend.cover_image ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${friend.cover_image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-xl p-3 border-2 ${playerStyles.border} ${playerStyles.ring} hover:border-orange-500/50 transition-all duration-500 ${playerStyles.glow} cursor-pointer ${playerStyles.transform} hover:scale-[1.02] ${
        isFlashing ? 'animate-pulse bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-orange-500/20 border-orange-500' : ''
      } ${!friend.cover_image ? `bg-gradient-to-br ${playerStyles.background}` : ''}`}
      style={friend.cover_image ? backgroundStyle : {}}
    >
      {/* Loading Overlay DOAR pentru încărcarea inițială și actualizarea manuală */}
      {shouldShowLoadingOverlay && (
        <div className="absolute inset-0 bg-gray-900/90 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-gray-600/30"></div>
              <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
              <LoaderCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-400 animate-spin" size={16} />
            </div>
            <div className="text-center">
              <span className="text-xs text-orange-400 font-medium block">Se încarcă...</span>
              <span className="text-xs text-gray-400">{friend.nickname}</span>
            </div>
          </div>
        </div>
      )}

      {/* Background overlay to ensure text readability when cover image is present */}
      {friend.cover_image && (
        <div className="absolute inset-0 bg-black/30 rounded-xl"></div>
      )}

      {/* Main Content */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Avatar and Rank */}
        <PlayerAvatar 
          avatar={friend.avatar}
          nickname={friend.nickname}
          index={index}
          isLive={isLive}
        />

        {/* Player Info */}
        <PlayerInfo
          nickname={friend.nickname}
          level={friend.level}
          elo={friend.elo}
          lcryptData={friend.lcryptData}
          isLive={isLive}
        />
      </div>

      {/* Live Match Details - Compact Design */}
      <LiveMatchDetails 
        isLive={isLive}
        liveMatchDetails={liveMatchDetails}
      />

      {/* Stats Row - Compact Layout */}
      <div className="flex items-center justify-between gap-2 mt-1 relative z-10">
        <PlayerStatsCompact
          wins={friend.wins || 0}
          winRate={friend.winRate || 0}
          hsRate={friend.hsRate || 0}
          kdRatio={friend.kdRatio || 0}
        />

        {/* Actions */}
        <PlayerActionsCompact
          nickname={friend.nickname}
          steamId64={steamId64}
          isLive={isLive}
          onLinkClick={handleLinkClick}
        />
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
