import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { Trophy, Target, Crosshair, Zap, Globe, Flag, TrendingUp } from "lucide-react";
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { useState, useEffect } from "react";

interface PlayerStatsCardsProps {
  player: Player;
}

interface EloData {
  elo: number;
  level: string;
  region: string;
  country: string;
  country_flag: string;
  region_ranking: number | null;
  country_ranking: number | null;
  ladder_position: number | null;
  ladder_points: number | null;
  ladder_won: number | null;
  ladder_played: number | null;
  ladder_win_rate: number | null;
  last_match: string | null;
  trend: string | null;
}

export const PlayerStatsCards = ({ player }: PlayerStatsCardsProps) => {
  const [eloData, setEloData] = useState<EloData | null>(null);
  const [loadingElo, setLoadingElo] = useState(true);
  const [apiError, setApiError] = useState(false);
  const { getPlayerEloData } = useLcryptApi();

  useEffect(() => {
    const fetchEloData = async () => {
      setLoadingElo(true);
      setApiError(false);
      
      try {
        const data = await getPlayerEloData(player.nickname);
        setEloData(data);
        
        // If data is null, it means the API failed but we handled it gracefully
        if (data === null) {
          setApiError(true);
        }
      } catch (error) {
        console.error('Error in fetchEloData:', error);
        setApiError(true);
        setEloData(null);
      } finally {
        setLoadingElo(false);
      }
    };

    if (player.nickname) {
      fetchEloData();
    }
  }, [player.nickname, getPlayerEloData]);

  const formatRanking = (ranking: number | null, type: string) => {
    if (!ranking) return 'N/A';
    if (ranking >= 1000000) return `${Math.floor(ranking / 1000000)}M+`;
    if (ranking >= 1000) return `${Math.floor(ranking / 1000)}K+`;
    return `#${ranking}`;
  };

  const getLevelColor = (level: number | string) => {
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    if (lvl >= 9) return 'from-red-500 to-red-600';
    if (lvl >= 7) return 'from-purple-500 to-purple-600';
    if (lvl >= 5) return 'from-blue-500 to-blue-600';
    if (lvl >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* ELO Card with Lcrypt data */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Trophy className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-gray-400">ELO</span>
        </div>
        {loadingElo ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400 mx-auto"></div>
        ) : apiError ? (
          <>
            <div className="text-lg font-bold text-orange-400">
              {player.elo || 0}
            </div>
            <div className="text-xs text-gray-500">FACEIT</div>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-orange-400">
              {eloData?.elo || player.elo || 0}
            </div>
            {eloData?.level && (
              <Badge className={`mt-1 bg-gradient-to-r ${getLevelColor(eloData.level)} text-white border-0 text-xs px-1 py-0`}>
                Lvl {eloData.level}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Global Ranking */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">Global</span>
        </div>
        {loadingElo ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mx-auto"></div>
        ) : apiError || !eloData ? (
          <div className="text-lg font-bold text-gray-400">N/A</div>
        ) : (
          <div className="text-lg font-bold text-blue-400">
            {formatRanking(eloData.region_ranking, 'region')}
          </div>
        )}
      </div>

      {/* Country Ranking */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Flag className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">Țară</span>
        </div>
        {loadingElo ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400 mx-auto"></div>
        ) : apiError || !eloData ? (
          <div className="text-lg font-bold text-gray-400">N/A</div>
        ) : (
          <div className="text-lg font-bold text-green-400">
            {formatRanking(eloData.country_ranking, 'country')}
          </div>
        )}
      </div>

      {/* Win Rate */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">Win Rate</span>
        </div>
        <div className="text-lg font-bold text-purple-400">
          {player.winRate || 0}%
        </div>
      </div>

      {/* K/D Ratio */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">K/D</span>
        </div>
        <div className="text-lg font-bold text-blue-400">
          {player.kdRatio || 0}
        </div>
      </div>

      {/* Headshot % */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Crosshair className="w-4 h-4 text-red-400" />
          <span className="text-xs text-gray-400">HS%</span>
        </div>
        <div className="text-lg font-bold text-red-400">
          {player.hsRate || 0}%
        </div>
      </div>

      {/* Wins */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-gray-400">Victorii</span>
        </div>
        <div className="text-lg font-bold text-yellow-400">
          {player.wins || 0}
        </div>
      </div>

      {/* Ladder Points (if available) */}
      {eloData?.ladder_points && !apiError && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400">Puncte</span>
          </div>
          <div className="text-lg font-bold text-cyan-400">
            {eloData.ladder_points}
          </div>
        </div>
      )}
    </div>
  );
};