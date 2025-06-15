
import { Player, Match } from "@/types/Player";

export const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatMatchDuration = (startTime: number, endTime: number) => {
  const duration = endTime - startTime;
  const minutes = Math.floor(duration / 60);
  return `${minutes}m`;
};

export const getMatchResult = (match: Match, player: Player) => {
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

export const getMatchScore = (match: Match, matchesStats: {[key: string]: any}) => {
  console.log('=== ANALYZING MATCH SCORE ===');
  console.log('Match ID:', match.match_id);
  
  const matchStatsData = matchesStats[match.match_id];
  console.log('Match Stats Data:', JSON.stringify(matchStatsData, null, 2));
  
  // Priority 1: Check direct round_stats at root level
  if (matchStatsData?.round_stats?.Score) {
    console.log('📊 Checking direct round_stats for score...');
    const scoreValue = matchStatsData.round_stats.Score;
    console.log('Score value:', scoreValue, 'Type:', typeof scoreValue);
    
    if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
      console.log('✅ Found string score format in round_stats:', scoreValue);
      const cleanScore = scoreValue.trim().replace(/\s+/g, ' ');
      const parts = cleanScore.split('/').map(s => s.trim());
      if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
        const formattedScore = `${parts[0]} - ${parts[1]}`;
        console.log('✅ Final formatted score from round_stats:', formattedScore);
        return formattedScore;
      }
    }
  }
  
  // Priority 2: Try from match stats rounds
  if (matchStatsData?.rounds && Array.isArray(matchStatsData.rounds) && matchStatsData.rounds.length > 0) {
    console.log('📊 Checking rounds array for score...');
    
    for (let i = matchStatsData.rounds.length - 1; i >= 0; i--) {
      const round = matchStatsData.rounds[i];
      console.log(`Round ${i}:`, round);
      
      if (round.round_stats?.Score) {
        console.log('Found Score in round:', round.round_stats.Score);
        
        const scoreValue = round.round_stats.Score;
        if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
          console.log('✅ Found string score format in rounds:', scoreValue);
          const cleanScore = scoreValue.trim().replace(/\s+/g, ' ');
          const parts = cleanScore.split('/').map(s => s.trim());
          if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            const formattedScore = `${parts[0]} - ${parts[1]}`;
            console.log('✅ Final formatted score from rounds:', formattedScore);
            return formattedScore;
          }
        }
      }
    }
  }
  
  // Priority 3: Try from match stats results
  if (matchStatsData?.results?.score) {
    console.log('📊 Checking match stats results for score...');
    const scoreData = matchStatsData.results.score;
    console.log('Match stats score object:', scoreData);
    
    const scoreValues = Object.values(scoreData) as unknown[];
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
  
  console.log('❌ No valid score found');
  return 'N/A';
};

export const getMapInfo = (match: Match, matchesStats: {[key: string]: any}) => {
  console.log('Getting map info for:', match.match_id);
  
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
  
  if (match.competition_name && match.competition_name !== 'CS2') {
    return match.competition_name;
  }
  
  console.log('No map found, using default');
  return 'Unknown';
};
