
import { Player, Match } from "@/types/Player";

export const getEloChange = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
  console.log('=== ANALYZING ELO CHANGE ===');
  console.log('Match ID:', match.match_id);
  console.log('Player ID:', player.player_id);
  
  const matchStatsData = matchesStats[match.match_id];
  if (!matchStatsData) {
    console.log('❌ No match stats data available');
    return null;
  }
  
  console.log('Full match stats data for ELO:', JSON.stringify(matchStatsData, null, 2));
  
  // Priority 1: Check calculate_elo array
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
  
  console.log('❌ No ELO change found');
  return null;
};

export const getPlayerStatsFromMatch = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
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

export const getKDRatio = (stats: any) => {
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

export const getHeadshotPercentage = (stats: any) => {
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

export const getADR = (stats: any) => {
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

export const getKDA = (stats: any) => {
  if (!stats) {
    return { kills: '0', deaths: '0', assists: '0' };
  }
  
  return {
    kills: stats.Kills || stats.kills || '0',
    deaths: stats.Deaths || stats.deaths || '0',
    assists: stats.Assists || stats.assists || '0'
  };
};
