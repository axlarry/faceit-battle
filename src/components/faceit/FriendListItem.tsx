import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Player } from "@/types/Player";
import { EloChangeIndicator } from './EloChangeIndicator';
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface FriendListItemProps {
  friend: FriendWithLcrypt;
  index: number;
  isFlashing: boolean;
  onPlayerClick: (player: Player) => void;
}

const getLevelIcon = (level: number) => {
  // Faceit skill level icons - you can upload custom icons and replace these paths
  const iconMap: { [key: number]: string } = {
    1: '/faceit-icons/skill-level-1.svg',
    2: '/faceit-icons/skill-level-2.svg',
    3: '/faceit-icons/skill-level-3.svg',
    4: '/faceit-icons/skill-level-4.svg',
    5: '/faceit-icons/skill-level-5.svg',
    6: '/faceit-icons/skill-level-6.svg',
    7: '/faceit-icons/skill-level-7.svg',
    8: '/faceit-icons/skill-level-8.svg',
    9: '/faceit-icons/skill-level-9.svg',
    10: '/faceit-icons/skill-level-10.svg',
  };
  
  return iconMap[level] || iconMap[1];
};

// Convert Steam ID to Steam ID64
const convertSteamIdToSteamId64 = (steamId: string): string => {
  // Steam ID format: STEAM_0:Y:Z where Y is 0 or 1, Z is the account number
  const steamIdMatch = steamId.match(/^STEAM_[0-5]:([01]):(\d+)$/);
  
  if (!steamIdMatch) {
    // If it's already a Steam ID64 or different format, return as is
    return steamId;
  }
  
  const y = parseInt(steamIdMatch[1]);
  const z = parseInt(steamIdMatch[2]);
  
  // Steam ID64 calculation: 76561197960265728 + (Z * 2) + Y
  const steamId64 = 76561197960265728n + BigInt(z * 2) + BigInt(y);
  
  return steamId64.toString();
};

export const FriendListItem = React.memo(({ 
  friend, 
  index, 
  isFlashing, 
  onPlayerClick 
}: FriendListItemProps) => {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [steamId64, setSteamId64] = useState<string | null>(null);
  const { makeApiCall } = useFaceitApi();

  useEffect(() => {
    const fetchSteamId = async () => {
      try {
        const playerData = await makeApiCall(`/players/${friend.player_id}`);
        if (playerData?.platforms?.steam) {
          const steamIdRaw = playerData.platforms.steam;
          setSteamId(steamIdRaw);
          const steamId64Converted = convertSteamIdToSteamId64(steamIdRaw);
          setSteamId64(steamId64Converted);
        }
      } catch (error) {
        console.error('Error fetching Steam ID:', error);
      }
    };

    fetchSteamId();
  }, [friend.player_id, makeApiCall]);

  const handleClick = () => {
    onPlayerClick(friend);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-[#2a2f36] rounded-lg p-2 sm:p-3 border border-[#3a4048] hover:border-[#ff6500]/50 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.01] ${
        isFlashing ? 'animate-pulse bg-[#ff6500]/20 border-[#ff6500]' : ''
      }`}
    >
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
          <div className="text-base sm:text-lg font-bold text-[#ff6500] min-w-[2rem] sm:min-w-[2.5rem] flex-shrink-0">
            #{index + 1}
          </div>
          
          <img
            src={friend.avatar}
            alt={friend.nickname}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-[#ff6500] shadow-lg flex-shrink-0"
          />
          
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{friend.nickname}</h3>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <div className="flex items-center gap-1">
                <img
                  src={getLevelIcon(friend.level || 1)}
                  alt={`Skill Level ${friend.level}`}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  onError={(e) => {
                    // Fallback to colored badge if icon fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallbackBadge = target.nextElementSibling as HTMLElement;
                    if (fallbackBadge) fallbackBadge.style.display = 'inline-flex';
                  }}
                />
                <Badge 
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-1 sm:px-2 py-0.5 sm:py-1 text-xs hidden"
                  style={{ display: 'none' }}
                >
                  Nivel {friend.level}
                </Badge>
              </div>
              <span className="text-[#ff6500] font-bold text-xs sm:text-sm">{friend.elo} ELO</span>
              <div className="w-full sm:w-auto">
                <EloChangeIndicator lcryptData={friend.lcryptData} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
          <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-3 flex-grow sm:flex-grow-0">
            <div className="text-center">
              <div className="text-white font-bold text-xs sm:text-sm">{friend.wins}</div>
              <div className="text-[#9f9f9f] text-xs">Victorii</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-xs sm:text-sm">{friend.winRate}%</div>
              <div className="text-[#9f9f9f] text-xs">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-xs sm:text-sm">{friend.hsRate}%</div>
              <div className="text-[#9f9f9f] text-xs">HS%</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-xs sm:text-sm">{friend.kdRatio}</div>
              <div className="text-[#9f9f9f] text-xs">K/D</div>
            </div>
          </div>
          
          <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-0" onClick={handleLinkClick}>
            <a
              href={`https://www.faceit.com/en/players/${friend.nickname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg px-2 sm:px-3 h-6 sm:h-7 font-bold text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105"
            >
              <ExternalLink size={10} className="sm:hidden" />
              <ExternalLink size={11} className="hidden sm:block" />
              <span className="hidden sm:inline">Faceit</span>
            </a>
            <a
              href={steamId64 ? `https://steamcommunity.com/profiles/${steamId64}` : `https://steamcommunity.com/search/users/#text=${friend.nickname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white rounded-lg px-2 sm:px-3 h-6 sm:h-7 font-bold text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105"
            >
              <ExternalLink size={10} className="sm:hidden" />
              <ExternalLink size={11} className="hidden sm:block" />
              <span className="hidden sm:inline">Steam</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
