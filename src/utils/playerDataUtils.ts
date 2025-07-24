
import { Player, Match } from "@/types/Player";

export const getPlayerStatsFromMatch = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
  console.log('=== GETTING PLAYER STATS ===');
  console.log('Match ID:', match.match_id);
  
  // For FaceitAnalyser API, stats are directly in the match object
  if (match.playerStats) {
    console.log('✅ Found player stats directly in match:', match.playerStats);
    return match.playerStats;
  }
  
  // Check if stats are directly in the match object (FaceitAnalyser format)
  if (match.k !== undefined || match.i6 !== undefined) {
    const stats = {
      Kills: match.k || match.i6 || '0',
      Deaths: match.d || match.i8 || '0', 
      Assists: match.a || match.i7 || '0',
      Headshots: match.i13 || '0',
      'MVPs': match.i9 || '0',
      'K/D Ratio': match.kdr || match.c3 || '0',
      'K/R Ratio': match.c2 || '0',
      'Headshots %': match.c4 || '0',
      'Average Damage per Round': '0', // Not available in FaceitAnalyser
    };
    console.log('✅ Found player stats in match data (FaceitAnalyser):', stats);
    return stats;
  }
  
  // First try from match teams data (original Faceit API format)
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
