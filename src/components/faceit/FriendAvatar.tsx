
import React from 'react';

interface FriendAvatarProps {
  avatar: string;
  nickname: string;
  index: number;
}

export const FriendAvatar = ({ avatar, nickname, index }: FriendAvatarProps) => {
  return (
    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
      <div className="text-2xl sm:text-3xl font-bold text-[#ff6500] min-w-[3rem] sm:min-w-[4rem] flex-shrink-0">
        #{index + 1}
      </div>
      
      <img
        src={avatar}
        alt={nickname}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-[#ff6500] shadow-lg flex-shrink-0"
      />
    </div>
  );
};
