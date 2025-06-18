
interface PlayerStatsProps {
  wins: number;
  winRate: number;
  hsRate: number;
  kdRatio: number;
}

export const PlayerStats = ({ wins, winRate, hsRate, kdRatio }: PlayerStatsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-5 lg:gap-7 text-sm w-full sm:w-auto justify-between sm:justify-end">
      <div className="text-center">
        <div className="text-white font-medium text-lg sm:text-xl">{wins}</div>
        <div className="text-gray-400 text-sm">Victorii</div>
      </div>
      <div className="text-center">
        <div className="text-white font-medium text-lg sm:text-xl">{winRate}%</div>
        <div className="text-gray-400 text-sm">Win Rate</div>
      </div>
      <div className="text-center">
        <div className="text-white font-medium text-lg sm:text-xl">{hsRate}%</div>
        <div className="text-gray-400 text-sm">HS%</div>
      </div>
      <div className="text-center">
        <div className="text-white font-medium text-lg sm:text-xl">{kdRatio}</div>
        <div className="text-gray-400 text-sm">K/D</div>
      </div>
    </div>
  );
};
