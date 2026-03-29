
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
  if (!match.teams || !match.results) {
    return null;
  }

  const teamIds = Object.keys(match.teams);
  const winnerTeamId = match.results.winner;

  let playerTeamId = '';
  for (const teamId of teamIds) {
    const team = match.teams[teamId];
    if (team.players?.some(p => p.player_id === player.player_id)) {
      playerTeamId = teamId;
      break;
    }
  }

  if (!playerTeamId) {
    return null;
  }

  return playerTeamId === winnerTeamId;
};

export const getMatchScore = (match: Match, matchesStats: {[key: string]: any}, player: Player) => {
  const matchStatsData = matchesStats[match.match_id];

  let scoreString = '';

  // Priority 1: Check direct round_stats at root level
  if (matchStatsData?.round_stats?.Score) {
    const scoreValue = matchStatsData.round_stats.Score;
    if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
      scoreString = scoreValue.trim().replace(/\s+/g, ' ');
    }
  }

  // Priority 2: Try from match stats rounds
  if (!scoreString && matchStatsData?.rounds && Array.isArray(matchStatsData.rounds) && matchStatsData.rounds.length > 0) {
    for (let i = matchStatsData.rounds.length - 1; i >= 0; i--) {
      const round = matchStatsData.rounds[i];
      if (round.round_stats?.Score) {
        const scoreValue = round.round_stats.Score;
        if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
          scoreString = scoreValue.trim().replace(/\s+/g, ' ');
          break;
        }
      }
    }
  }

  // Priority 3: Try from match stats results
  if (!scoreString && matchStatsData?.results?.score) {
    const scoreData = matchStatsData.results.score;
    const scoreValues = Object.values(scoreData) as unknown[];
    for (const scoreValue of scoreValues) {
      if (typeof scoreValue === 'string' && scoreValue.includes('/')) {
        scoreString = scoreValue.trim().replace(/\s+/g, ' ');
        break;
      }
    }

    if (!scoreString && scoreValues.length === 2) {
      const numericScores = scoreValues
        .map(score => parseInt(String(score), 10))
        .filter(score => !isNaN(score))
        .sort((a, b) => b - a);

      if (numericScores.length === 2) {
        scoreString = `${numericScores[0]} / ${numericScores[1]}`;
      }
    }
  }

  if (!scoreString) {
    return 'N/A';
  }

  // Parse the score string and format based on match result
  const parts = scoreString.split('/').map(s => s.trim());
  if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
    const score1 = parseInt(parts[0]);
    const score2 = parseInt(parts[1]);

    const isWin = getMatchResult(match, player);

    if (isWin === true) {
      const playerScore = Math.max(score1, score2);
      const opponentScore = Math.min(score1, score2);
      return `${playerScore} - ${opponentScore}`;
    } else if (isWin === false) {
      const playerScore = Math.min(score1, score2);
      const opponentScore = Math.max(score1, score2);
      return `${playerScore} - ${opponentScore}`;
    } else {
      return `${score1} - ${score2}`;
    }
  }

  return 'N/A';
};

export const getMapInfo = (match: Match, matchesStats: {[key: string]: any}) => {
  const matchStatsData = matchesStats[match.match_id];
  if (matchStatsData) {
    if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds) && matchStatsData.rounds.length > 0) {
      const firstRound = matchStatsData.rounds[0];
      if (firstRound.round_stats && firstRound.round_stats.Map) {
        return firstRound.round_stats.Map;
      }
    }

    if (matchStatsData.voting?.map?.pick?.[0]) {
      return matchStatsData.voting.map.pick[0];
    }

    if (matchStatsData.voting?.location?.pick?.[0]) {
      return matchStatsData.voting.location.pick[0];
    }

    if (matchStatsData.map) {
      return matchStatsData.map;
    }
  }

  if (match.competition_name && match.competition_name !== 'CS2') {
    return match.competition_name;
  }

  return 'Unknown';
};
