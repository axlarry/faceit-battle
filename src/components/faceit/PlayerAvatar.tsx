
import React from 'react';

interface PlayerAvatarProps {
  avatar: string;
  nickname: string;
  index: number;
  isLive: boolean;
}

export const PlayerAvatar = ({ avatar, nickname, index, isLive }: PlayerAvatarProps) => {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="text-lg font-bold text-[#ff6500] min-w-[2rem] text-center">
        #{index + 1}
      </div>
      <div className="relative">
        <img
          src={avatar}
          alt={nickname}
          className={`w-12 h-12 rounded-lg border-2 ${isLive ? 'border-green-400 ring-2 ring-green-500/50' : 'border-[#ff6500]'} shadow-lg flex-shrink-0`}
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
