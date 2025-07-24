
import { Player } from "@/types/Player";
import { useLcryptApi } from "@/hooks/useLcryptApi";

interface PlayerStatsCardsProps {
  player: Player;
  playerStats?: any;
  isLoading?: boolean;
}

export const PlayerStatsCards = ({ player, playerStats, isLoading }: PlayerStatsCardsProps) => {
  const { data: lcryptData, loading: lcryptLoading } = useLcryptApi(player.nickname);

  // Extract stats from either playerStats or lcryptData
  const displayStats = {
    elo: lcryptData?.elo || player.elo || '?',
    level: lcryptData?.level || player.level || '?',
    wins: player.wins || '?',
    winRate: player.winRate || '?',
    kdRatio: player.kdRatio || '?',
    hsRate: player.hsRate || '?'
  };

  // Extract additional stats from Faceit API if available
  if (playerStats?.segments) {
    const segment = playerStats.segments[0];
    if (segment?.stats) {
      displayStats.kdRatio = segment.stats['K/D Ratio']?.value || displayStats.kdRatio;
      displayStats.hsRate = Math.round(parseFloat(segment.stats['Headshots %']?.value || '0'));
      displayStats.wins = segment.stats.Wins?.value || displayStats.wins;
      displayStats.winRate = Math.round(parseFloat(segment.stats['Win Rate %']?.value || '0'));
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-2 text-center border border-green-500/30">
        <div className="text-lg font-bold text-green-400">
          {isLoading ? '...' : displayStats.wins}
        </div>
        <div className="text-gray-400 text-xs">Victorii</div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-2 text-center border border-blue-500/30">
        <div className="text-lg font-bold text-blue-400">
          {isLoading ? '...' : `${displayStats.winRate}%`}
        </div>
        <div className="text-gray-400 text-xs">Win Rate</div>
      </div>
      
      <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-2 text-center border border-red-500/30">
        <div className="text-lg font-bold text-red-400">
          {isLoading ? '...' : `${displayStats.hsRate}%`}
        </div>
        <div className="text-gray-400 text-xs">Headshot %</div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-2 text-center border border-purple-500/30">
        <div className="text-lg font-bold text-purple-400">
          {isLoading || lcryptLoading ? '...' : lcryptData ? lcryptData.elo : displayStats.kdRatio}
        </div>
        <div className="text-gray-400 text-xs">
          {lcryptData ? 'ELO Actual' : 'K/D Ratio'}
        </div>
      </div>
    </div>
  );
};
