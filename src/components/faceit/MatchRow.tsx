import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Player, Match } from "@/types/Player";
import { Trophy, Calendar, MapPin, Clock, Target, TrendingUp, TrendingDown, Minus, Zap, Crosshair } from "lucide-react";
import { 
  formatDate, 
  formatMatchDuration, 
  getMatchResult, 
  getMatchScore, 
  getMapInfo 
} from "@/utils/matchUtils";
import { getEloChange } from "@/utils/eloUtils";
import { getPlayerStatsFromMatch, getKDA } from "@/utils/playerDataUtils";
import { getKDRatio, getHeadshotPercentage, getADR } from "@/utils/statsUtils";
import { useFaceitApi } from "@/hooks/useFaceitApi";
import { useState, useEffect } from "react";

interface MatchRowProps {
  match: Match;
  player: Player;
  matchesStats: {[key: string]: any};
  onMatchClick: (match: Match) => void;
}

export const MatchRow = ({ match, player, matchesStats, onMatchClick }: MatchRowProps) => {
  const [eloChange, setEloChange] = useState<{ elo_change: number } | null>(null);
  const [loadingElo, setLoadingElo] = useState(true);
  const { getMatchDetails, apiKey, loading: apiLoading } = useFaceitApi();
  
  const isWin = getMatchResult(match, player);
  const playerStats = getPlayerStatsFromMatch(match, player, matchesStats);
  const mapName = getMapInfo(match, matchesStats);
  const matchScore = getMatchScore(match, matchesStats, player);
  const kda = getKDA(playerStats);

  useEffect(() => {
    const fetchEloChange = async () => {
      // Wait for API key to be loaded
      if (apiLoading) {
        return;
      }
      
      // If no API key available, stop loading and show "-"
      if (!apiKey) {
        setLoadingElo(false);
        return;
      }

      setLoadingElo(true);
      try {
        const result = await getEloChange(match, player, matchesStats, getMatchDetails);
        setEloChange(result);
      } catch (error) {
        console.error('Error fetching ELO change:', error);
        setEloChange(null);
      } finally {
        setLoadingElo(false);
      }
    };

    fetchEloChange();
  }, [match.match_id, player.player_id, apiKey, apiLoading]);

  return (
    <TableRow 
      key={match.match_id}
      className={`border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${
        isWin === true ? 'bg-green-500/5' : isWin === false ? 'bg-red-500/5' : ''
      }`}
      onClick={() => onMatchClick(match)}
    >
      {/* Result */}
      <TableCell>
        {isWin !== null ? (
          <Badge className={`${
            isWin 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          } border font-semibold`}>
            {isWin ? 'W' : 'L'}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>

      {/* Map */}
      <TableCell>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400" />
          <span className="text-white font-medium">{mapName}</span>
        </div>
      </TableCell>

      {/* Score */}
      <TableCell>
        <span className="text-white font-bold">
          {matchScore}
        </span>
      </TableCell>

      {/* K/D/A */}
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="text-green-400 font-bold">{kda.kills}</span>
          <span className="text-gray-400">/</span>
          <span className="text-red-400 font-bold">{kda.deaths}</span>
          <span className="text-gray-400">/</span>
          <span className="text-blue-400 font-bold">{kda.assists}</span>
        </div>
      </TableCell>

      {/* K/D Ratio */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400 font-bold">
            {getKDRatio(playerStats)}
          </span>
        </div>
      </TableCell>

      {/* Headshot % */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-red-400" />
          <span className="text-red-400 font-bold">
            {getHeadshotPercentage(playerStats)}%
          </span>
        </div>
      </TableCell>

      {/* ADR */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-yellow-400 font-bold">
            {getADR(playerStats)}
          </span>
        </div>
      </TableCell>

      {/* ELO Change */}
      <TableCell>
        {loadingElo ? (
          <div className="flex items-center gap-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-400"></div>
            <span className="text-gray-400 text-xs">...</span>
          </div>
        ) : eloChange && typeof eloChange.elo_change === 'number' ? (
          <div className="flex items-center gap-1">
            {eloChange.elo_change > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : eloChange.elo_change < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
            <span className={`font-bold ${
              eloChange.elo_change > 0 ? 'text-green-400' : 
              eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {eloChange.elo_change > 0 ? '+' : ''}{eloChange.elo_change}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>

      {/* Date */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-gray-300 text-sm">
            {formatDate(match.started_at)}
          </span>
        </div>
      </TableCell>

      {/* Duration */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-300 text-sm">
            {formatMatchDuration(match.started_at, match.finished_at)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
};
