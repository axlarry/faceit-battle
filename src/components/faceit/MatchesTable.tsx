
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
import { Trophy, Calendar, MapPin, Clock, Target, TrendingUp, TrendingDown, Minus, Zap, Crosshair } from "lucide-react";

interface MatchesTableProps {
  player: Player;
  matches: Match[];
  matchesStats: {[key: string]: any};
  loadingMatches: boolean;
}

export const MatchesTable = ({ player, matches, matchesStats, loadingMatches }: MatchesTableProps) => {
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
  );
};
