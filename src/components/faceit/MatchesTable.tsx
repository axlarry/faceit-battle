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
    console.log('=== ANALYZING MATCH RESULT ===');
    console.log('Match ID:', match.match_id);
    console.log('Full match object:', JSON.stringify(match, null, 2));
    
    if (!match.teams || !match.results) {
      console.log('❌ No teams or results data available');
      return null;
    }
    
    const teamIds = Object.keys(match.teams);
    const winnerTeamId = match.results.winner;
    
    console.log('Team IDs:', teamIds);
    console.log('Winner Team ID:', winnerTeamId);
    
    // Find which team the player is on
    let playerTeamId = '';
    for (const teamId of teamIds) {
      const team = match.teams[teamId];
      console.log(`Checking team ${teamId}:`, team);
      if (team.players?.some(p => p.player_id === player.player_id)) {
        playerTeamId = teamId;
        console.log(`✅ Player found in team: ${teamId}`);
        break;
      }
    }
    
    if (!playerTeamId) {
      console.log('❌ Player not found in any team');
      return null;
    }
    
    const isWin = playerTeamId === winnerTeamId;
    console.log(`Match result: ${isWin ? 'WIN' : 'LOSS'}`);
    return isWin;
  };

  const getMatchScore = (match: Match) => {
    console.log('=== ANALYZING MATCH SCORE ===');
    console.log('Match ID:', match.match_id);
    
    // Get match stats data
    const matchStatsData = matchesStats[match.match_id];
    console.log('Match Stats Data:', JSON.stringify(matchStatsData, null, 2));
    
    // Priority 1: Try from match stats rounds (most reliable)
    if (matchStatsData?.rounds && Array.isArray(matchStatsData.rounds) && matchStatsData.rounds.length > 0) {
      console.log('📊 Checking rounds data for score...');
      
      // Find final round with score
      for (let i = matchStatsData.rounds.length - 1; i >= 0; i--) {
        const round = matchStatsData.rounds[i];
        console.log(`Round ${i}:`, round);
        
        if (round.round_stats?.Score) {
          console.log('Found Score object:', round.round_stats.Score);
          
          // Handle different score formats
          const scoreValues = Object.values(round.round_stats.Score);
          console.log('Score values:', scoreValues);
          
          // Check if it's a string format like "13 / 8"
          for (const scoreValue of scoreValues) {
            if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
              console.log('✅ Found string score format:', scoreValue);
              // Clean up the score string and format it
              const cleanScore = scoreValue.trim().replace(/\s+/g, ' ');
              const parts = cleanScore.split('/').map(s => s.trim());
              if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
                const formattedScore = `${parts[0]} - ${parts[1]}`;
                console.log('✅ Final formatted score:', formattedScore);
                return formattedScore;
              }
            }
          }
          
          // Fallback to numeric values
          if (scoreValues.length === 2) {
            const numericScores = scoreValues
              .map(score => parseInt(String(score), 10))
              .filter(score => !isNaN(score))
              .sort((a, b) => b - a); // Sort descending
            
            if (numericScores.length === 2) {
              const finalScore = `${numericScores[0]} - ${numericScores[1]}`;
              console.log('✅ Final score from numeric values:', finalScore);
              return finalScore;
            }
          }
        }
      }
    }
    
    // Priority 2: Try from match stats results
    if (matchStatsData?.results?.score) {
      console.log('📊 Checking match stats results for score...');
      const scoreData = matchStatsData.results.score;
      console.log('Match stats score object:', scoreData);
      
      // Handle string format scores
      const scoreValues = Object.values(scoreData);
      for (const scoreValue of scoreValues) {
        if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
          console.log('✅ Found string score format in results:', scoreValue);
          const cleanScore = scoreValue.trim().replace(/\s+/g, ' ');
          const parts = cleanScore.split('/').map(s => s.trim());
          if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            const formattedScore = `${parts[0]} - ${parts[1]}`;
            console.log('✅ Final formatted score from results:', formattedScore);
            return formattedScore;
          }
        }
      }
      
      // Fallback to numeric parsing
      if (scoreValues.length === 2) {
        const numericScores = scoreValues
          .map(score => parseInt(String(score), 10))
          .filter(score => !isNaN(score))
          .sort((a, b) => b - a);
        
        if (numericScores.length === 2) {
          const finalScore = `${numericScores[0]} - ${numericScores[1]}`;
          console.log('✅ Final score from match stats results numeric:', finalScore);
          return finalScore;
        }
      }
    }
    
    // Priority 3: Try from match results (fallback)
    if (match.results?.score) {
      console.log('📊 Checking match results for score...');
      const scoreData = match.results.score;
      console.log('Match results score object:', scoreData);
      
      // Handle string format scores
      const scoreValues = Object.values(scoreData);
      for (const scoreValue of scoreValues) {
        if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
          console.log('✅ Found string score format in match results:', scoreValue);
          const cleanScore = scoreValue.trim().replace(/\s+/g, ' ');
          const parts = cleanScore.split('/').map(s => s.trim());
          if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            const formattedScore = `${parts[0]} - ${parts[1]}`;
            console.log('✅ Final formatted score from match results:', formattedScore);
            return formattedScore;
          }
        }
      }
      
      // Fallback to numeric parsing
      if (scoreValues.length === 2) {
        const numericScores = scoreValues
          .map(score => parseInt(String(score), 10))
          .filter(score => !isNaN(score))
          .sort((a, b) => b - a);
        
        if (numericScores.length === 2) {
          const finalScore = `${numericScores[0]} - ${numericScores[1]}`;
          console.log('✅ Final score from match results numeric:', finalScore);
          return finalScore;
        }
      }
    }
    
    console.log('❌ No valid score found');
    return 'N/A';
  };

  const getEloChange = (match: Match) => {
    console.log('=== ANALYZING ELO CHANGE ===');
    console.log('Match ID:', match.match_id);
    console.log('Player ID:', player.player_id);
    
    const matchStatsData = matchesStats[match.match_id];
    if (!matchStatsData) {
      console.log('❌ No match stats data available');
      return null;
    }
    
    console.log('Full match stats data for ELO:', JSON.stringify(matchStatsData, null, 2));
    
    // Priority 1: Check calculate_elo array (most reliable)
    if (matchStatsData.calculate_elo && Array.isArray(matchStatsData.calculate_elo)) {
      console.log('📊 Checking calculate_elo array...');
      console.log('Calculate ELO data:', matchStatsData.calculate_elo);
      
      const playerEloData = matchStatsData.calculate_elo.find((elo: any) => 
        elo.player_id === player.player_id
      );
      
      if (playerEloData) {
        console.log('Found player ELO data:', playerEloData);
        if (typeof playerEloData.elo_change === 'number') {
          console.log('✅ ELO change from calculate_elo:', playerEloData.elo_change);
          return { elo_change: playerEloData.elo_change };
        }
      }
    }
    
    // Priority 2: Check in rounds data
    if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds)) {
      console.log('📊 Checking rounds for ELO data...');
      
      for (const round of matchStatsData.rounds) {
        if (round.teams) {
          for (const team of Object.values(round.teams) as any[]) {
            if (team.players) {
              const playerData = team.players.find((p: any) => p.player_id === player.player_id);
              if (playerData) {
                console.log('Player data in round:', playerData);
                if (typeof playerData.elo_change === 'number') {
                  console.log('✅ ELO change from rounds:', playerData.elo_change);
                  return { elo_change: playerData.elo_change };
                }
                // Check for elo object with before/after
                if (playerData.elo && playerData.elo.after && playerData.elo.before) {
                  const eloChange = playerData.elo.after - playerData.elo.before;
                  console.log('✅ Calculated ELO change from before/after:', eloChange);
                  return { elo_change: eloChange };
                }
              }
            }
          }
        }
      }
    }
    
    // Priority 3: Check in teams data
    if (matchStatsData.teams) {
      console.log('📊 Checking teams for ELO data...');
      
      for (const team of Object.values(matchStatsData.teams) as any[]) {
        if (team.players) {
          const playerData = team.players.find((p: any) => p.player_id === player.player_id);
          if (playerData) {
            console.log('Player data in team:', playerData);
            if (typeof playerData.elo_change === 'number') {
              console.log('✅ ELO change from teams:', playerData.elo_change);
              return { elo_change: playerData.elo_change };
            }
            // Check for elo object with before/after
            if (playerData.elo && playerData.elo.after && playerData.elo.before) {
              const eloChange = playerData.elo.after - playerData.elo.before;
              console.log('✅ Calculated ELO change from teams before/after:', eloChange);
              return { elo_change: eloChange };
            }
          }
        }
      }
    }
    
    // Priority 4: Check direct elo_change in match stats
    if (matchStatsData.elo_change && typeof matchStatsData.elo_change === 'number') {
      console.log('✅ ELO change from direct field:', matchStatsData.elo_change);
      return { elo_change: matchStatsData.elo_change };
    }
    
    // Priority 5: Check if there's an elo field with before/after values
    if (matchStatsData.elo) {
      console.log('📊 Checking ELO object:', matchStatsData.elo);
      if (matchStatsData.elo.after && matchStatsData.elo.before) {
        const eloChange = matchStatsData.elo.after - matchStatsData.elo.before;
        console.log('✅ Calculated ELO change:', eloChange);
        return { elo_change: eloChange };
      }
    }
    
    console.log('❌ No ELO change found');
    return null;
  };

  const getPlayerStatsFromMatch = (match: Match) => {
    console.log('=== GETTING PLAYER STATS ===');
    console.log('Match ID:', match.match_id);
    
    // First try from match teams data
    if (match.teams) {
      for (const teamId of Object.keys(match.teams)) {
        const team = match.teams[teamId];
        const playerData = team.players?.find(p => p.player_id === player.player_id);
        if (playerData && playerData.player_stats) {
          console.log('✅ Found player stats in teams:', playerData.player_stats);
          return playerData.player_stats;
        }
      }
    }
    
    // Try from match stats data
    const matchStatsData = matchesStats[match.match_id];
    if (matchStatsData) {
      // Check if it's match stats response
      if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds)) {
        for (const round of matchStatsData.rounds) {
          if (round.teams) {
            for (const team of Object.values(round.teams) as any[]) {
              if (team.players) {
                const playerStats = team.players.find((p: any) => p.player_id === player.player_id);
                if (playerStats && playerStats.player_stats) {
                  console.log('✅ Found player stats in rounds:', playerStats.player_stats);
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
              console.log('✅ Found player stats in match details:', playerStats.player_stats);
              return playerStats.player_stats;
            }
          }
        }
      }
    }
    
    console.log('❌ No player stats found');
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
    if (!stats) return '0.00';
    
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
    
    return '0.00';
  };

  const getHeadshotPercentage = (stats: any) => {
    if (!stats) return '0';
    
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
    
    return '0';
  };

  const getADR = (stats: any) => {
    if (!stats) return '0';
    
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
    
    return '0';
  };

  const getKDA = (stats: any) => {
    if (!stats) {
      return { kills: '0', deaths: '0', assists: '0' };
    }
    
    return {
      kills: stats.Kills || stats.kills || '0',
      deaths: stats.Deaths || stats.deaths || '0',
      assists: stats.Assists || stats.assists || '0'
    };
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
                      {eloChange && typeof eloChange.elo_change === 'number' ? (
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
