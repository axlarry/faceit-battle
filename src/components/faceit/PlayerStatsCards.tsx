
import { Player } from "@/types/Player";

interface PlayerStatsCardsProps {
  player: Player;
}

export const PlayerStatsCards = ({ player }: PlayerStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-2 text-center border border-green-500/30">
        <div className="text-lg font-bold text-green-400">{player.wins}</div>
        <div className="text-gray-400 text-xs">Victorii</div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-2 text-center border border-blue-500/30">
        <div className="text-lg font-bold text-blue-400">{player.winRate}%</div>
        <div className="text-gray-400 text-xs">Win Rate</div>
      </div>
      
      <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-2 text-center border border-red-500/30">
        <div className="text-lg font-bold text-red-400">{player.hsRate}%</div>
        <div className="text-gray-400 text-xs">Headshot %</div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-2 text-center border border-purple-500/30">
        <div className="text-lg font-bold text-purple-400">{player.kdRatio}</div>
        <div className="text-gray-400 text-xs">K/D Ratio</div>
      </div>
    </div>
  );
};
