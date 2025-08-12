
import React from 'react';

interface FriendAvatarProps {
  avatar: string;
  nickname: string;
  index: number;
}

export const FriendAvatar = ({ avatar, nickname, index }: FriendAvatarProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
      <div className="text-xl sm:text-2xl font-bold text-[#ff6500] min-w-[2.5rem] sm:min-w-[3rem] flex-shrink-0">
        #{index + 1}
      </div>
      
      <img
        src={avatar}
        alt={nickname}
        loading="lazy"
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-[#ff6500] shadow-lg flex-shrink-0"
      />
    </div>
  );
};
