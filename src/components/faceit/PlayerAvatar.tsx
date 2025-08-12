
import React from 'react';
import { Crown, Trophy } from 'lucide-react';

interface PlayerAvatarProps {
  avatar: string;
  nickname: string;
  index: number;
  isLive: boolean;
}

export const PlayerAvatar = ({ avatar, nickname, index, isLive }: PlayerAvatarProps) => {
  const isFirstPlace = index === 0;
  const isSecondPlace = index === 1;
  const isThirdPlace = index === 2;
  
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`text-lg font-bold min-w-[2rem] text-center relative ${
        isFirstPlace ? 'text-yellow-400' : 
        isSecondPlace ? 'text-gray-300' :
        isThirdPlace ? 'text-amber-600' :
        'text-[#ff6500]'
      }`}>
        {isFirstPlace ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">1</span>
            </div>
          </div>
        ) : isSecondPlace ? (
          <div className="flex flex-col items-center justify-center">
            <Trophy className="w-5 h-5 text-gray-300" />
            <span className="text-xs font-bold">#2</span>
          </div>
        ) : isThirdPlace ? (
          <div className="flex flex-col items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold">#3</span>
          </div>
        ) : (
          <>#{index + 1}</>
        )}
      </div>
      <div className="relative">
        <img
          src={avatar}
          alt={nickname}
          className={`w-16 h-16 rounded-lg border-2 shadow-lg flex-shrink-0 transition-all duration-300 ${
            isLive 
              ? 'border-green-400 ring-2 ring-green-500/50' 
              : 'border-[#ff6500]'
          }`}
        />
        {isLive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
          </div>
        )}
      </div>
    </div>
  );
};
