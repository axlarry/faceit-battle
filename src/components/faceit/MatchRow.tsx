import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Player, Match } from "@/types/Player";
import { Trophy, Calendar, Clock, Target, TrendingUp, TrendingDown, Minus, Zap, Crosshair, Radio, Download, Map, ExternalLink } from "lucide-react";
import { formatDate, formatMatchDuration, getMatchResult, getMatchScore, getMapInfo } from "@/utils/matchUtils";
import { getEloChange } from "@/utils/eloUtils";
import { getPlayerStatsFromMatch, getKDA } from "@/utils/playerDataUtils";
import { getKDRatio, getHeadshotPercentage, getADR } from "@/utils/statsUtils";
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { parseLcryptReport, findMatchEloChange } from "@/utils/lcryptUtils";
import { useState, useEffect } from "react";

interface MatchRowProps {
  match: Match & {
    isLiveMatch?: boolean;
    liveMatchDetails?: any;
  };
  player: Player;
  matchesStats: {
    [key: string]: any;
  };
  onMatchClick: (match: Match) => void;
  matchIndex: number;
}

export const MatchRow = ({
  match,
  player,
  matchesStats,
  onMatchClick,
  matchIndex
}: MatchRowProps) => {
  const isWin = getMatchResult(match, player);
  const playerStats = getPlayerStatsFromMatch(match, player, matchesStats);
  const eloChange = getEloChange(match, player, matchesStats);
  const mapName = getMapInfo(match, matchesStats);
  const matchScore = getMatchScore(match, matchesStats, player);
  const kda = getKDA(playerStats);
  const {
    data: lcryptData
  } = useLcryptApi(player.nickname);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [liveMatchUrl, setLiveMatchUrl] = useState<string | null>(null);

  // Parse lcrypt report and find ELO change for this match
  const lcryptMatches = lcryptData?.report ? parseLcryptReport(lcryptData.report) : [];
  const lcryptEloChange = findMatchEloChange(match, lcryptMatches, matchIndex);

  // Check for live match URL when it's a live match
  useEffect(() => {
    if (match.isLiveMatch && player.player_id) {
      const checkLiveMatch = async () => {
        try {
          const { liveMatchService } = await import('@/services/liveMatchService');
          const liveInfo = await liveMatchService.getPlayerLiveMatch(player.player_id);
          if (liveInfo && liveInfo.matchRoomUrl) {
            setLiveMatchUrl(liveInfo.matchRoomUrl);
          } else {
            // Fallback to constructing URL from match ID
            setLiveMatchUrl(`https://www.faceit.com/en/cs2/room/${match.match_id}`);
          }
        } catch (error) {
          console.error('Error getting live match URL:', error);
          // Fallback to constructing URL from match ID
          setLiveMatchUrl(`https://www.faceit.com/en/cs2/room/${match.match_id}`);
        }
      };
      checkLiveMatch();
    }
  }, [match.isLiveMatch, match.match_id, player.player_id]);

  // Function to get map icon URL from local assets
  const getMapIconUrl = (mapName: string) => {
    if (!mapName || mapName === 'Unknown') return null;

    // Clean and normalize the map name
    const cleanMapName = mapName.toLowerCase().trim();

    // Common map name mappings for icon files
    const mapMappings: {
      [key: string]: string;
    } = {
      'de_dust2': 'icon_de_dust2.png',
      'dust2': 'icon_de_dust2.png',
      'de_mirage': 'icon_de_mirage.png',
      'mirage': 'icon_de_mirage.png',
      'de_inferno': 'icon_de_inferno.png',
      'inferno': 'icon_de_inferno.png',
      'de_overpass': 'icon_de_overpass.png',
      'overpass': 'icon_de_overpass.png',
      'de_train': 'icon_de_train.png',
      'train': 'icon_de_train.png',
      'de_nuke': 'icon_de_nuke.png',
      'nuke': 'icon_de_nuke.png',
      'de_vertigo': 'icon_de_vertigo.png',
      'vertigo': 'icon_de_vertigo.png',
      'de_ancient': 'icon_de_ancient.png',
      'ancient': 'icon_de_ancient.png',
      'de_anubis': 'icon_de_anubis.png',
      'anubis': 'icon_de_anubis.png'
    };
    const iconFileName = mapMappings[cleanMapName];
    if (iconFileName) {
      return `/faceit-icons/${iconFileName}`;
    }
    return null;
  };
  const handleImageError = (mapName: string) => {
    console.log(`Failed to load icon for map: ${mapName}`);
    setImageLoadErrors(prev => new Set([...prev, mapName]));
  };
  const renderMapDisplay = (mapName: string) => {
    const iconUrl = getMapIconUrl(mapName);
    const hasError = imageLoadErrors.has(mapName);
    return <div className="flex items-center gap-2">
        <div className="w-10 h-7 rounded overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
          {iconUrl && !hasError ? <img src={iconUrl} alt={mapName} onError={() => handleImageError(mapName)} onLoad={() => console.log(`Successfully loaded icon for: ${mapName}`)} className="w-full h-full object-scale-down" /> : <Map className="w-4 h-4 text-orange-400" />}
        </div>
        <span className="text-white font-medium">{mapName}</span>
      </div>;
  };
  const handleDownloadDemo = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click

    // Create the demo download URL using match ID
    const demoUrl = `https://www.faceit.com/en/cs2/room/${match.match_id}`;

    // Open in new tab
    window.open(demoUrl, '_blank');
  };

  const handleMatchRoomClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click

    // Use the fetched live match URL or fallback
    const matchRoomUrl = liveMatchUrl || `https://www.faceit.com/en/cs2/room/${match.match_id}`;

    // Open in new tab
    window.open(matchRoomUrl, '_blank');
  };

  // Handle live match differently
  if (match.isLiveMatch) {
    const liveScore = match.liveMatchDetails?.score || 'În Desfășurare';
    const liveElo = match.liveMatchDetails?.elo || match.liveMatchDetails?.elo_change;
    const liveMapName = match.liveMatchDetails?.voting?.map?.pick?.[0] || mapName || 'TBD';
    
    return (
      <TableRow key={match.match_id} className="border-white/10 bg-green-500/10 hover:bg-green-500/20 transition-colors">
        {/* Result - Live indicator */}
        <TableCell>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border font-semibold">
            <Radio className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </TableCell>

        {/* Map */}
        <TableCell>
          {renderMapDisplay(liveMapName)}
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

        {/* MatchRoom button for live matches */}
        <TableCell>
          <Button
            onClick={handleMatchRoomClick}
            size="sm"
            variant="outline"
            className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            MatchRoom
          </Button>
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
  return <TableRow key={match.match_id} className={`border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${isWin === true ? 'bg-green-500/5' : isWin === false ? 'bg-red-500/5' : ''}`} onClick={() => onMatchClick(match)}>
      {/* Result */}
      <TableCell>
        {isWin !== null ? <Badge className={`${isWin ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border font-semibold`}>
            {isWin ? 'W' : 'L'}
          </Badge> : <span className="text-gray-400">-</span>}
      </TableCell>

      {/* Map */}
      <TableCell>
        {renderMapDisplay(mapName)}
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
        {lcryptEloChange !== null ? <div className="flex items-center gap-1">
            {lcryptEloChange > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : lcryptEloChange < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-gray-400" />}
            <span className={`font-bold ${lcryptEloChange > 0 ? 'text-green-400' : lcryptEloChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {lcryptEloChange > 0 ? '+' : ''}{lcryptEloChange}
            </span>
          </div> : eloChange && typeof eloChange.elo_change === 'number' ? <div className="flex items-center gap-1">
            {eloChange.elo_change > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : eloChange.elo_change < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-gray-400" />}
            <span className={`font-bold ${eloChange.elo_change > 0 ? 'text-green-400' : eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {eloChange.elo_change > 0 ? '+' : ''}{eloChange.elo_change}
            </span>
          </div> : <span className="text-gray-400">-</span>}
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

      {/* Demo Download Button */}
      <TableCell>
        <Button onClick={handleDownloadDemo} size="sm" variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-colors">
          <Download className="w-3 h-3 mr-1" />
          Demo
        </Button>
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
    </TableRow>;
};
