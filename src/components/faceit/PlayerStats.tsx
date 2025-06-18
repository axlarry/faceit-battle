
interface PlayerStatsProps {
  wins: number;
  winRate: number;
  hsRate: number;
  kdRatio: number;
}

export const PlayerStats = ({ wins, winRate, hsRate, kdRatio }: PlayerStatsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
      <div className="text-center">
        <div className="text-white font-medium text-xs sm:text-sm">{wins}</div>
        <div className="text-gray-400 text-xs">Victorii</div>
      </div>
      <div className="text-center">
        <div className="text-white font-medium text-xs sm:text-sm">{winRate}%</div>
        <div className="text-gray-400 text-xs">Win Rate</div>
      </div>
      <div className="text-center">
        <div className="text-white font-medium text-xs sm:text-sm">{hsRate}%</div>
        <div className="text-gray-400 text-xs">HS%</div>
      </div>
      <div className="text-center">
        <div className="text-white font-medium text-xs sm:text-sm">{kdRatio}</div>
        <div className="text-gray-400 text-xs">K/D</div>
      </div>
    </div>
  );
};
