
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
  if (level >= 9) return 'bg-red-500';
  if (level >= 7) return 'bg-purple-500';
  if (level >= 5) return 'bg-blue-500';
  if (level >= 3) return 'bg-green-500';
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
      className={`bg-[#2a2f36] rounded-lg p-3 border border-[#3a4048] hover:border-[#ff6500]/50 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.01] ${
        isFlashing ? 'animate-pulse bg-[#ff6500]/20 border-[#ff6500]' : ''
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="text-lg font-bold text-[#ff6500] min-w-[2.5rem]">
            #{index + 1}
          </div>
          
          <img
            src={friend.avatar}
            alt={friend.nickname}
            className="w-10 h-10 rounded-lg border-2 border-[#ff6500] shadow-lg"
          />
          
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white truncate">{friend.nickname}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge className={`${getLevelColor(friend.level || 0)} text-white border-0 px-2 py-1 text-xs`}>
                Nivel {friend.level}
              </Badge>
              <span className="text-[#ff6500] font-bold text-sm">{friend.elo} ELO</span>
              <EloChangeIndicator lcryptData={friend.lcryptData} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto justify-between lg:justify-end">
          <div className="text-center">
            <div className="text-white font-bold text-sm">{friend.wins}</div>
            <div className="text-[#9f9f9f] text-xs">Victorii</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-sm">{friend.winRate}%</div>
            <div className="text-[#9f9f9f] text-xs">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-sm">{friend.hsRate}%</div>
            <div className="text-[#9f9f9f] text-xs">HS%</div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-sm">{friend.kdRatio}</div>
            <div className="text-[#9f9f9f] text-xs">K/D</div>
          </div>
          
          <div className="flex gap-2" onClick={handleLinkClick}>
            <a
              href={`https://www.faceit.com/en/players/${friend.nickname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg px-3 h-7 font-bold text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105"
            >
              <ExternalLink size={11} />
              Faceit
            </a>
            <a
              href={`https://steamcommunity.com/search/users/#text=${friend.nickname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white rounded-lg px-3 h-7 font-bold text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105"
            >
              <ExternalLink size={11} />
              Steam
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendListItem.displayName = 'FriendListItem';
