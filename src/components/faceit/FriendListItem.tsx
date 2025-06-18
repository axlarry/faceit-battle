
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Player } from "@/types/Player";
import { EloChangeIndicator } from './EloChangeIndicator';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface FriendListItemProps {
  friend: FriendWithLcrypt;
  index: number;
  isFlashing: boolean;
  onPlayerClick: (player: Player) => void;
}

const getLevelColor = (level: number) => {
  if (level >= 10) return 'bg-red-500';
  if (level >= 8) return 'bg-orange-500';
  if (level >= 4) return 'bg-yellow-500';
  if (level >= 1) return 'bg-green-500';
  return 'bg-gray-500';
};

export const FriendListItem = React.memo(({ 
  friend, 
  index, 
  isFlashing, 
  onPlayerClick 
}: FriendListItemProps) => {
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
              <Badge className={`${getLevelColor(friend.level || 0)} text-white border-0 px-1 sm:px-2 py-0.5 sm:py-1 text-xs`}>
                Nivel {friend.level}
              </Badge>
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
              href={`https://steamcommunity.com/search/users/#text=${friend.nickname}`}
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
