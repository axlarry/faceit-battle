
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trophy, Target, TrendingUp } from "lucide-react";
import { Player } from "@/types/Player";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface LeaderboardTableProps {
  region: string;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

export const LeaderboardTable = ({ region, onShowPlayerDetails, onAddFriend }: LeaderboardTableProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const { getLeaderboard, loading: apiLoading } = useFaceitApi();

  useEffect(() => {
    if (region !== 'FRIENDS' && region !== 'FACEIT_TOOL') {
      loadLeaderboard();
    }
  }, [region]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(region);
      const formattedPlayers: Player[] = data.map((item: any, index: number) => ({
        player_id: item.player_id,
        nickname: item.nickname,
        avatar: item.avatar || '/placeholder.svg',
        position: item.position || index + 1,
        level: item.skill_level,
        elo: item.faceit_elo,
        wins: 0, // Not available in leaderboard data
        winRate: 0, // Not available in leaderboard data
        hsRate: 0, // Not available in leaderboard data
        kdRatio: 0 // Not available in leaderboard data
      }));
      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  if (apiLoading || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
        <span className="ml-2 text-gray-400">Se încarcă clasamentul...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Clasament {region}
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-white/10 text-gray-400 text-xs sm:text-sm font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4 sm:col-span-3">Jucător</div>
            <div className="col-span-2 text-center">Nivel</div>
            <div className="col-span-2 text-center">ELO</div>
            <div className="col-span-3 sm:col-span-4 text-center">Acțiuni</div>
          </div>

          {/* Players List */}
          <div className="space-y-1">
            {players.map((player) => (
              <div
                key={player.player_id}
                className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => onShowPlayerDetails(player)}
              >
                {/* Position */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-sm sm:text-base">
                    #{player.position}
                  </span>
                </div>

                {/* Player Info */}
                <div className="col-span-4 sm:col-span-3 flex items-center gap-2 sm:gap-3">
                  <img
                    src={player.avatar}
                    alt={player.nickname}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-orange-400"
                  />
                  <div>
                    <div className="text-white font-medium text-sm sm:text-base truncate">
                      {player.nickname}
                    </div>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-2 flex items-center justify-center">
                  <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs sm:text-sm px-2 py-1`}>
                    {player.level}
                  </Badge>
                </div>

                {/* ELO */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-sm sm:text-base">
                      {player.elo?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-3 sm:col-span-4 flex items-center justify-center gap-1 sm:gap-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 text-xs px-2 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddFriend(player);
                    }}
                  >
                    <UserPlus size={12} className="mr-1" />
                    <span className="hidden sm:inline">Adaugă</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white text-xs px-2 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowPlayerDetails(player);
                    }}
                  >
                    <Target size={12} className="mr-1" />
                    <span className="hidden sm:inline">Detalii</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {players.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          Nu s-au găsit jucători pentru această regiune.
        </div>
      )}
    </div>
  );
};
