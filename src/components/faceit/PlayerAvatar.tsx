
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
        isFirstPlace ? 'text-yellow-400' : 'text-[#ff6500]'
      }`}>
        {isFirstPlace ? (
          <div className="flex items-center justify-center">
            <div className="relative">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">1</span>
            </div>
          </div>
        ) : (
          <>#{index + 1}</>
        )}
      </div>
      <div className="relative">
        <img
          src={avatar}
          alt={nickname}
          className={`w-12 h-12 rounded-lg border-2 shadow-lg flex-shrink-0 transition-all duration-300 ${
            isFirstPlace 
              ? 'border-yellow-400 ring-2 ring-yellow-500/30' 
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
          <div className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
        )}
      </div>
    </div>
  );
};
