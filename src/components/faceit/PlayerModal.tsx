
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Player, Match } from "@/types/Player";
import { UserPlus, UserMinus, ExternalLink, Trophy, Calendar, Users, Target, TrendingUp, TrendingDown, Minus, MapPin, Clock, Shield, Zap, Crosshair } from "lucide-react";
import { useState, useEffect } from "react";
import { PasswordDialog } from "./PasswordDialog";
import { toast } from "@/hooks/use-toast";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
}

export const PlayerModal = ({ 
  player, 
  isOpen, 
  onClose, 
  onAddFriend, 
  onRemoveFriend, 
  isFriend 
}: PlayerModalProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesStats, setMatchesStats] = useState<{[key: string]: any}>({});
  const { getPlayerMatches, getMatchDetails, getMatchStats } = useFaceitApi();

  // Load matches when player changes and modal is open
  useEffect(() => {
    if (player && isOpen) {
      loadPlayerMatches();
    }
  }, [player, isOpen]);

  const loadPlayerMatches = async () => {
    if (!player) return;
    
    setLoadingMatches(true);
    
    try {
      console.log('Loading matches for player:', player.player_id);
      
      const matchesData = await getPlayerMatches(player.player_id, 10);
      console.log('Matches data received:', matchesData);
      setMatches(matchesData);

      // Load detailed stats for each match
      if (matchesData.length > 0) {
        const statsPromises = matchesData.map(async (match: Match) => {
          try {
            console.log('Loading stats for match:', match.match_id);
            
            // Try to get match stats first
            const matchStats = await getMatchStats(match.match_id);
            if (matchStats) {
              console.log('Match stats response:', matchStats);
              return { [match.match_id]: matchStats };
            }
            
            // Fallback to match details
            const matchDetail = await getMatchDetails(match.match_id);
            if (matchDetail) {
              console.log('Match detail response:', matchDetail);
              return { [match.match_id]: matchDetail };
            }
          } catch (error) {
            console.error('Error loading match data:', error);
          }
          return {};
        });

        const statsResults = await Promise.all(statsPromises);
        const combinedStats = statsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        console.log('Combined match stats:', combinedStats);
        setMatchesStats(combinedStats);
      }

    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  if (!player) return null;

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const handleFriendAction = () => {
    if (isFriend) {
      setPendingAction('remove');
    } else {
      setPendingAction('add');
    }
    setShowPasswordDialog(true);
  };

  const confirmAction = () => {
    if (pendingAction === 'add') {
      onAddFriend(player);
    } else if (pendingAction === 'remove') {
      onRemoveFriend(player.player_id);
    }
    setPendingAction(null);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchResult = (match: Match) => {
    console.log('Getting match result for:', match.match_id, match);
    
    if (!match.teams || !match.results) {
      console.log('No teams or results data');
      return null;
    }
    
    const teamIds = Object.keys(match.teams);
    const winnerTeamId = match.results.winner;
    
    console.log('Team IDs:', teamIds, 'Winner:', winnerTeamId);
    
    // Find which team the player is on
    let playerTeamId = '';
    for (const teamId of teamIds) {
      const team = match.teams[teamId];
      if (team.players?.some(p => p.player_id === player.player_id)) {
        playerTeamId = teamId;
        break;
      }
    }
    
    console.log('Player team ID:', playerTeamId);
    
    return playerTeamId === winnerTeamId;
  };

  const getPlayerStatsFromMatch = (match: Match) => {
    console.log('Getting player stats from match:', match.match_id);
    
    // First try from match teams data
    if (match.teams) {
      for (const teamId of Object.keys(match.teams)) {
        const team = match.teams[teamId];
        const playerData = team.players?.find(p => p.player_id === player.player_id);
        if (playerData && playerData.player_stats) {
          console.log('Found player stats in teams:', playerData.player_stats);
          return playerData.player_stats;
        }
      }
    }
    
    // Try from match stats data
    const matchStatsData = matchesStats[match.match_id];
    if (matchStatsData) {
      console.log('Checking match stats data:', matchStatsData);
      
      // Check if it's match stats response
      if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds)) {
        for (const round of matchStatsData.rounds) {
          if (round.teams) {
            for (const team of Object.values(round.teams) as any[]) {
              if (team.players) {
                const playerStats = team.players.find((p: any) => p.player_id === player.player_id);
                if (playerStats && playerStats.player_stats) {
                  console.log('Found player stats in rounds:', playerStats.player_stats);
                  return playerStats.player_stats;
                }
              }
            }
          }
        }
      }
      
      // Check if it's match details with teams
      if (matchStatsData.teams) {
        for (const team of Object.values(matchStatsData.teams) as any[]) {
          if (team.players) {
            const playerStats = team.players.find((p: any) => p.player_id === player.player_id);
            if (playerStats && playerStats.player_stats) {
              console.log('Found player stats in match details:', playerStats.player_stats);
              return playerStats.player_stats;
            }
          }
        }
      }
    }
    
    console.log('No player stats found for match:', match.match_id);
    return null;
  };

  const getMatchScore = (match: Match) => {
    console.log('Getting match score for:', match.match_id);
    
    // Try to get score from results first
    if (match.results && match.results.score) {
      const scores = Object.values(match.results.score);
      console.log('Scores from results:', scores);
      if (scores.length === 2) {
        const numericScores = scores.map(score => Number(score)).filter(score => !isNaN(score));
        if (numericScores.length === 2) {
          const sortedScores = numericScores.sort((a, b) => b - a);
          return `${sortedScores[0]} - ${sortedScores[1]}`;
        }
      }
    }

    // Try to get score from match stats
    const matchStatsData = matchesStats[match.match_id];
    if (matchStatsData) {
      console.log('Checking match stats for score:', matchStatsData);
      
      if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds)) {
        // Get the final round for the score
        const lastRound = matchStatsData.rounds[matchStatsData.rounds.length - 1];
        if (lastRound && lastRound.round_stats && lastRound.round_stats.Score) {
          const scores = Object.values(lastRound.round_stats.Score);
          if (scores.length === 2) {
            const numericScores = scores.map(score => Number(score)).filter(score => !isNaN(score));
            if (numericScores.length === 2) {
              const sortedScores = numericScores.sort((a, b) => b - a);
              return `${sortedScores[0]} - ${sortedScores[1]}`;
            }
          }
        }
      }
      
      if (matchStatsData.results && matchStatsData.results.score) {
        const scores = Object.values(matchStatsData.results.score);
        if (scores.length === 2) {
          const numericScores = scores.map(score => Number(score)).filter(score => !isNaN(score));
          if (numericScores.length === 2) {
            const sortedScores = numericScores.sort((a, b) => b - a);
            return `${sortedScores[0]} - ${sortedScores[1]}`;
          }
        }
      }
    }

    console.log('No score found for match:', match.match_id);
    return null;
  };

  const getMapInfo = (match: Match) => {
    console.log('Getting map info for:', match.match_id);
    
    // Try to get map from match stats first
    const matchStatsData = matchesStats[match.match_id];
    if (matchStatsData) {
      console.log('Checking match stats for map:', matchStatsData);
      
      if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds) && matchStatsData.rounds.length > 0) {
        const firstRound = matchStatsData.rounds[0];
        if (firstRound.round_stats && firstRound.round_stats.Map) {
          console.log('Found map in rounds:', firstRound.round_stats.Map);
          return firstRound.round_stats.Map;
        }
      }
      
      if (matchStatsData.voting?.map?.pick?.[0]) {
        console.log('Found map in voting:', matchStatsData.voting.map.pick[0]);
        return matchStatsData.voting.map.pick[0];
      }
      
      if (matchStatsData.voting?.location?.pick?.[0]) {
        console.log('Found location in voting:', matchStatsData.voting.location.pick[0]);
        return matchStatsData.voting.location.pick[0];
      }
      
      if (matchStatsData.map) {
        console.log('Found direct map:', matchStatsData.map);
        return matchStatsData.map;
      }
    }
    
    // Fallback to match competition name or type
    if (match.competition_name && match.competition_name !== 'CS2') {
      return match.competition_name;
    }
    
    console.log('No map found, using default');
    return 'Unknown';
  };

  const formatMatchDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    return `${minutes}m`;
  };

  const getKDRatio = (stats: any) => {
    if (!stats) {
      console.log('No stats for K/D ratio');
      return '0.00';
    }
    
    console.log('Getting K/D ratio from stats:', stats);
    
    // Try different possible field names for K/D ratio
    if (stats['K/D Ratio']) {
      return parseFloat(stats['K/D Ratio']).toFixed(2);
    }
    
    if (stats.Kills && stats.Deaths) {
      const kills = parseInt(stats.Kills);
      const deaths = parseInt(stats.Deaths);
      return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    }
    
    if (stats.kills && stats.deaths) {
      const kills = parseInt(stats.kills);
      const deaths = parseInt(stats.deaths);
      return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    }
    
    console.log('No K/D ratio found in stats');
    return '0.00';
  };

  const getHeadshotPercentage = (stats: any) => {
    if (!stats) {
      console.log('No stats for headshot percentage');
      return '0';
    }
    
    console.log('Getting headshot percentage from stats:', stats);
    
    // Try different possible field names
    if (stats['Headshots %']) {
      return Math.round(parseFloat(stats['Headshots %']));
    }
    
    if (stats['Headshot %']) {
      return Math.round(parseFloat(stats['Headshot %']));
    }
    
    if (stats.headshots_percentage) {
      return Math.round(parseFloat(stats.headshots_percentage));
    }
    
    if (stats.Headshots && stats.Kills) {
      const headshots = parseInt(stats.Headshots);
      const kills = parseInt(stats.Kills);
      return kills > 0 ? Math.round((headshots / kills) * 100) : 0;
    }
    
    if (stats.headshots && stats.kills) {
      const headshots = parseInt(stats.headshots);
      const kills = parseInt(stats.kills);
      return kills > 0 ? Math.round((headshots / kills) * 100) : 0;
    }
    
    console.log('No headshot percentage found in stats');
    return '0';
  };

  const getADR = (stats: any) => {
    if (!stats) {
      console.log('No stats for ADR');
      return '0';
    }
    
    console.log('Getting ADR from stats:', stats);
    
    // Try different possible field names for ADR
    if (stats.ADR) {
      return Math.round(parseFloat(stats.ADR));
    }
    
    if (stats['Average Damage per Round']) {
      return Math.round(parseFloat(stats['Average Damage per Round']));
    }
    
    if (stats.average_damage) {
      return Math.round(parseFloat(stats.average_damage));
    }
    
    if (stats['Damage/Round']) {
      return Math.round(parseFloat(stats['Damage/Round']));
    }
    
    console.log('No ADR found in stats');
    return '0';
  };

  const getKDA = (stats: any) => {
    if (!stats) {
      console.log('No stats for KDA');
      return { kills: '0', deaths: '0', assists: '0' };
    }
    
    console.log('Getting KDA from stats:', stats);
    
    return {
      kills: stats.Kills || stats.kills || '0',
      deaths: stats.Deaths || stats.deaths || '0',
      assists: stats.Assists || stats.assists || '0'
    };
  };

  const getEloChange = (match: Match) => {
    console.log('Getting ELO change for match:', match.match_id);
    
    const matchStatsData = matchesStats[match.match_id];
    if (!matchStatsData) {
      console.log('No match stats data for ELO');
      return null;
    }
    
    console.log('Checking match stats for ELO:', matchStatsData);
    
    // Check if calculate_elo exists and is an array
    if (matchStatsData.calculate_elo && Array.isArray(matchStatsData.calculate_elo)) {
      const playerEloData = matchStatsData.calculate_elo.find((elo: any) => elo.player_id === player.player_id);
      if (playerEloData) {
        console.log('Found ELO data:', playerEloData);
        return playerEloData;
      }
    }
    
    // Check in rounds for ELO data
    if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds)) {
      for (const round of matchStatsData.rounds) {
        if (round.teams) {
          for (const team of Object.values(round.teams) as any[]) {
            if (team.players) {
              const playerData = team.players.find((p: any) => p.player_id === player.player_id);
              if (playerData && playerData.elo_change) {
                console.log('Found ELO change in rounds:', playerData.elo_change);
                return { elo_change: playerData.elo_change };
              }
            }
          }
        }
      }
    }
    
    console.log('No ELO change found');
    return null;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Profil Jucător - Detalii Complete
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Informații detaliate despre jucător și istoricul meciurilor recente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Player Header */}
            <div className="text-center space-y-4">
              <img
                src={player.avatar}
                alt={player.nickname}
                className="w-20 h-20 rounded-full border-4 border-orange-400 mx-auto"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{player.nickname}</h2>
                {player.position && (
                  <p className="text-orange-400 font-medium">#{player.position} în clasament</p>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">{player.level}</div>
                <div className="text-gray-400 text-sm">Nivel</div>
                <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs`}>
                  Skill Level {player.level}
                </Badge>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{player.elo}</div>
                <div className="text-gray-400 text-sm">ELO Points</div>
              </div>
            </div>

            {/* Detailed Stats */}
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

            {/* Recent Matches Section with Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">Meciurile Recente (Ultimele 10)</h3>
              </div>
              
              {loadingMatches ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                  <div className="text-gray-400 mt-3">Se încarcă meciurile...</div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Nu s-au găsit meciuri recente</div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-300 font-semibold">Rezultat</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Hartă</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Scor</TableHead>
                        <TableHead className="text-gray-300 font-semibold">K/D/A</TableHead>
                        <TableHead className="text-gray-300 font-semibold">K/D</TableHead>
                        <TableHead className="text-gray-300 font-semibold">HS%</TableHead>
                        <TableHead className="text-gray-300 font-semibold">ADR</TableHead>
                        <TableHead className="text-gray-300 font-semibold">ELO</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Data</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Durată</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => {
                        const isWin = getMatchResult(match);
                        const playerStats = getPlayerStatsFromMatch(match);
                        const eloChange = getEloChange(match);
                        const mapName = getMapInfo(match);
                        const matchScore = getMatchScore(match);
                        const kda = getKDA(playerStats);
                        
                        console.log('Rendering match row:', {
                          matchId: match.match_id,
                          isWin,
                          playerStats,
                          eloChange,
                          matchScore,
                          kda,
                          mapName
                        });
                        
                        return (
                          <TableRow 
                            key={match.match_id}
                            className={`border-white/10 hover:bg-white/5 transition-colors ${
                              isWin === true ? 'bg-green-500/5' : isWin === false ? 'bg-red-500/5' : ''
                            }`}
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
                                {matchScore || '-'}
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
                              {eloChange ? (
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
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleFriendAction}
                className={`px-4 py-2 font-medium text-sm ${
                  isFriend
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                } text-white border-0`}
              >
                {isFriend ? (
                  <>
                    <UserMinus size={14} className="mr-2" />
                    Șterge din Prieteni
                  </>
                ) : (
                  <>
                    <UserPlus size={14} className="mr-2" />
                    Adaugă la Prieteni
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-4 py-2 text-sm"
                onClick={() => window.open(`https://www.faceit.com/en/players/${player.nickname}`, '_blank')}
              >
                <ExternalLink size={14} className="mr-2" />
                Vezi pe FACEIT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPendingAction(null);
        }}
        onConfirm={confirmAction}
        title={pendingAction === 'add' ? 'Adaugă Prieten' : 'Șterge Prieten'}
        description={
          pendingAction === 'add' 
            ? `Vrei să adaugi ${player.nickname} în lista de prieteni?`
            : `Vrei să ștergi ${player.nickname} din lista de prieteni?`
        }
      />
    </>
  );
};
