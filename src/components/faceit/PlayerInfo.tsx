
import React from 'react';
import { FriendInfo } from './FriendInfo';

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
          {isLive && (
            <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs font-medium">LIVE</span>
            </div>
          )}
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
