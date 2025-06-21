
import React from 'react';
import { FriendInfo } from './FriendInfo';
import { LiveIndicator } from './LiveIndicator';

interface PlayerInfoProps {
  nickname: string;
  level?: number;
  elo?: number;
  lcryptData?: any;
  isLive: boolean;
}

export const PlayerInfo = ({ nickname, level, elo, lcryptData, isLive }: PlayerInfoProps) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-col gap-1">
        {/* Nickname with live indicator */}
        <div className="flex items-center gap-2 justify-between">
          <h3 className="text-base font-bold text-white truncate">{nickname}</h3>
          <LiveIndicator isLive={isLive} />
        </div>
        
        {/* ELO and Level Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <FriendInfo
            nickname={nickname}
            level={level}
            elo={elo || 0}
            lcryptData={lcryptData}
          />
        </div>
      </div>
    </div>
  );
};
