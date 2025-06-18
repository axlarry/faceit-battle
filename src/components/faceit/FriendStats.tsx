
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
      <div className="text-center min-w-[40px] sm:min-w-[45px]">
        <div className="text-white font-bold text-lg sm:text-xl">{wins}</div>
        <div className="text-[#9f9f9f] text-xs sm:text-sm">Victorii</div>
      </div>
      <div className="text-center min-w-[40px] sm:min-w-[45px]">
        <div className="text-white font-bold text-lg sm:text-xl">{winRate}%</div>
        <div className="text-[#9f9f9f] text-xs sm:text-sm">Win Rate</div>
      </div>
      <div className="text-center min-w-[40px] sm:min-w-[45px]">
        <div className="text-white font-bold text-lg sm:text-xl">{hsRate}%</div>
        <div className="text-[#9f9f9f] text-xs sm:text-sm">HS%</div>
      </div>
      <div className="text-center min-w-[40px] sm:min-w-[45px]">
        <div className="text-white font-bold text-lg sm:text-xl">{kdRatio}</div>
        <div className="text-[#9f9f9f] text-xs sm:text-sm">K/D</div>
      </div>
    </div>
  );
};
