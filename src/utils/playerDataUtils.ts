
import { Player, Match } from "@/types/Player";

export const getPlayerStatsFromMatch = (match: Match, player: Player, matchesStats: {[key: string]: any} = {}) => {
  if (!match || !player) {
    console.log('❌ Invalid match or player data');
    return null;
  }
  
  console.log('=== GETTING PLAYER STATS ===');
  console.log('Match ID:', match.match_id);
  console.log('Player ID:', player.player_id);
  
  // First check if we have playerStats directly in the match (from transformation)
  if ((match as any).playerStats) {
    console.log('✅ Found player stats in transformed match:', (match as any).playerStats);
    return (match as any).playerStats;
  }
  
  // Try from match teams data - handle both array and object formats
  if (match && match.teams) {
    console.log('🔍 Searching in teams data:', match.teams);
    
    // Handle teams as array (mock data)
    if (Array.isArray(match.teams)) {
      console.log('🎯 Processing teams as array');
      for (const team of match.teams) {
        if (team.players && Array.isArray(team.players)) {
          const playerData = team.players.find((p: any) => p.player_id === player.player_id);
          if (playerData && playerData.player_stats) {
            console.log('✅ Found player stats in array teams:', playerData.player_stats);
            return playerData.player_stats;
          }
        }
      }
    }
    
    // Handle teams as object (real API data)
    if (typeof match.teams === 'object' && !Array.isArray(match.teams)) {
      console.log('🎯 Processing teams as object');
      const teamKeys = Object.keys(match.teams);
      console.log('🎯 Team keys:', teamKeys);
      
      for (const teamKey of teamKeys) {
        const team = (match.teams as any)[teamKey];
        console.log(`🔍 Checking team ${teamKey}:`, team);
        
        if (team.players && Array.isArray(team.players)) {
          const playerData = team.players.find((p: any) => p.player_id === player.player_id);
          if (playerData && playerData.player_stats) {
            console.log('✅ Found player stats in object teams:', playerData.player_stats);
            console.log('🎯 Player stats keys:', Object.keys(playerData.player_stats));
            return playerData.player_stats;
          }
        }
      }
    }
  }
  
  // Try from match stats data (fallback)
  const matchStatsData = matchesStats && matchesStats[match.match_id];
  if (matchStatsData && typeof matchStatsData === 'object') {
    console.log('🔍 Searching in match stats data');
    
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
  
  console.log('❌ No player stats found for player:', player.player_id, 'in match:', match.match_id);
  return null;
};

export const getKDA = (stats: any) => {
  if (!stats) {
    console.log('❌ No stats provided to getKDA');
    return { kills: '0', deaths: '0', assists: '0' };
  }
  
  console.log('🎯 Extracting KDA from stats:', stats);
  console.log('🎯 Available stat keys:', Object.keys(stats));
  
  const result = {
    kills: stats.Kills || stats.kills || stats.K || '0',
    deaths: stats.Deaths || stats.deaths || stats.D || '0',
    assists: stats.Assists || stats.assists || stats.A || '0'
  };
  
  console.log('🎯 Extracted KDA:', result);
  return result;
};
