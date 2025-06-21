
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Player, Match } from "@/types/Player";
import { Trophy, Calendar, MapPin, Clock, Target, TrendingUp, TrendingDown, Minus, Zap, Crosshair, Radio } from "lucide-react";
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
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { parseLcryptReport, findMatchEloChange } from "@/utils/lcryptUtils";

interface MatchRowProps {
  match: Match & { isLiveMatch?: boolean; liveMatchDetails?: any };
  player: Player;
  matchesStats: {[key: string]: any};
  onMatchClick: (match: Match) => void;
  matchIndex: number;
}

export const MatchRow = ({ match, player, matchesStats, onMatchClick, matchIndex }: MatchRowProps) => {
  const isWin = getMatchResult(match, player);
  const playerStats = getPlayerStatsFromMatch(match, player, matchesStats);
  const eloChange = getEloChange(match, player, matchesStats);
  const mapName = getMapInfo(match, matchesStats);
  const matchScore = getMatchScore(match, matchesStats, player);
  const kda = getKDA(playerStats);
  const { data: lcryptData } = useLcryptApi(player.nickname);

  // Parse lcrypt report and find ELO change for this match
  const lcryptMatches = lcryptData?.report ? parseLcryptReport(lcryptData.report) : [];
  const lcryptEloChange = findMatchEloChange(match, lcryptMatches, matchIndex);

  // Handle live match differently
  if (match.isLiveMatch) {
    const liveScore = match.liveMatchDetails?.score || 'În Desfășurare';
    const liveElo = match.liveMatchDetails?.elo || match.liveMatchDetails?.elo_change;
    
    return (
      <TableRow 
        key={match.match_id}
        className="border-white/10 bg-green-500/10 hover:bg-green-500/20 transition-colors"
      >
        {/* Result - Live indicator */}
        <TableCell>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border font-semibold">
            <Radio className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </TableCell>

        {/* Map */}
        <TableCell>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span className="text-white font-medium">
              {match.liveMatchDetails?.voting?.map?.pick?.[0] || mapName || 'TBD'}
            </span>
          </div>
        </TableCell>

        {/* Score - Show live score if available */}
        <TableCell>
          <span className="text-green-400 font-bold">
            {liveScore}
          </span>
        </TableCell>

        {/* K/D/A - Not available for live matches */}
        <TableCell>
          <span className="text-gray-400">-/-/-</span>
        </TableCell>

        {/* K/D Ratio */}
        <TableCell>
          <span className="text-gray-400">-</span>
        </TableCell>

        {/* Headshot % */}
        <TableCell>
          <span className="text-gray-400">-</span>
        </TableCell>

        {/* ADR */}
        <TableCell>
          <span className="text-gray-400">-</span>
        </TableCell>

        {/* ELO Change - Show live ELO if available */}
        <TableCell>
          {liveElo ? (
            <span className="text-yellow-400 font-bold">
              {liveElo}
            </span>
          ) : (
            <span className="text-gray-400">Pending</span>
          )}
        </TableCell>

        {/* Date */}
        <TableCell>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-green-400" />
            <span className="text-green-300 text-sm font-medium">
              Acum
            </span>
          </div>
        </TableCell>

        {/* Duration */}
        <TableCell>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-green-400" />
            <span className="text-green-300 text-sm font-medium">
              Live
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Regular match row
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

      {/* ELO Change - now showing from lcrypt report */}
      <TableCell>
        {lcryptEloChange !== null ? (
          <div className="flex items-center gap-1">
            {lcryptEloChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : lcryptEloChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
            <span className={`font-bold ${
              lcryptEloChange > 0 ? 'text-green-400' : 
              lcryptEloChange < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {lcryptEloChange > 0 ? '+' : ''}{lcryptEloChange}
            </span>
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
