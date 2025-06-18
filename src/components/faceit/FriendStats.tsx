
import React from 'react';

interface FriendStatsProps {
  wins: number;
  winRate: number;
  hsRate: number;
  kdRatio: number;
}

export const FriendStats = ({ wins, winRate, hsRate, kdRatio }: FriendStatsProps) => {
  return (
    <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-1 flex-grow sm:flex-grow-0">
      <div className="text-center min-w-[35px] sm:min-w-[40px]">
        <div className="text-white font-bold text-base sm:text-lg">{wins}</div>
        <div className="text-[#9f9f9f] text-xs">Victorii</div>
      </div>
      <div className="text-center min-w-[35px] sm:min-w-[40px]">
        <div className="text-white font-bold text-base sm:text-lg">{winRate}%</div>
        <div className="text-[#9f9f9f] text-xs">Win Rate</div>
      </div>
      <div className="text-center min-w-[35px] sm:min-w-[40px]">
        <div className="text-white font-bold text-base sm:text-lg">{hsRate}%</div>
        <div className="text-[#9f9f9f] text-xs">HS%</div>
      </div>
      <div className="text-center min-w-[35px] sm:min-w-[40px]">
        <div className="text-white font-bold text-base sm:text-lg">{kdRatio}</div>
        <div className="text-[#9f9f9f] text-xs">K/D</div>
      </div>
    </div>
  );
};
