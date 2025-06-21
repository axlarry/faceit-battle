
import React from 'react';

interface PlayerStatsCompactProps {
  wins: number;
  winRate: number;
  hsRate: number;
  kdRatio: number;
}

export const PlayerStatsCompact = ({ wins, winRate, hsRate, kdRatio }: PlayerStatsCompactProps) => {
  return (
    <div className="flex gap-3 text-xs">
      <div className="text-center">
        <div className="text-white font-bold">{wins}</div>
        <div className="text-gray-400">W</div>
      </div>
      <div className="text-center">
        <div className="text-white font-bold">{winRate}%</div>
        <div className="text-gray-400">WR</div>
      </div>
      <div className="text-center">
        <div className="text-white font-bold">{hsRate}%</div>
        <div className="text-gray-400">HS</div>
      </div>
      <div className="text-center">
        <div className="text-white font-bold">{kdRatio}</div>
        <div className="text-gray-400">K/D</div>
      </div>
    </div>
  );
};
