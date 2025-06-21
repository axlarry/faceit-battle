
import React from 'react';
import { Crown } from 'lucide-react';

interface PlayerAvatarProps {
  avatar: string;
  nickname: string;
  index: number;
  isLive: boolean;
}

export const PlayerAvatar = ({ avatar, nickname, index, isLive }: PlayerAvatarProps) => {
  const isFirstPlace = index === 0;
  
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`text-lg font-bold min-w-[2rem] text-center relative ${
        isFirstPlace ? 'text-yellow-400 animate-pulse text-xl' : 'text-[#ff6500]'
      }`}>
        {isFirstPlace && (
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        )}
        #{index + 1}
        {isFirstPlace && (
          <Crown className="inline-block w-4 h-4 ml-1 text-yellow-400 animate-bounce" />
        )}
      </div>
      <div className="relative">
        <img
          src={avatar}
          alt={nickname}
          className={`w-12 h-12 rounded-lg border-2 shadow-lg flex-shrink-0 transition-all duration-300 ${
            isFirstPlace 
              ? 'border-yellow-400 ring-4 ring-yellow-500/50 shadow-yellow-500/50 animate-pulse' 
              : isLive 
                ? 'border-green-400 ring-2 ring-green-500/50' 
                : 'border-[#ff6500]'
          }`}
        />
        {isLive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
          </div>
        )}
        {isFirstPlace && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-xs text-black font-bold">1</span>
          </div>
        )}
      </div>
    </div>
  );
};
