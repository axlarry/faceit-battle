
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
      console.log('Round data:', round);
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
  
  // Priority 3: Check in the main match data structure
  if (match.teams) {
    console.log('📊 Checking match.teams for ELO data...');
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData) {
        console.log('Player data in match teams:', playerData);
        // Check if there's elo_change in player_stats or elsewhere
        if (playerData.player_stats) {
          console.log('Player stats:', playerData.player_stats);
          if (playerData.player_stats.elo_change) {
            const eloChange = parseInt(playerData.player_stats.elo_change);
            if (!isNaN(eloChange)) {
              console.log('✅ ELO change from player_stats:', eloChange);
              return { elo_change: eloChange };
            }
          }
        }
      }
    }
  }
  
  // Priority 4: Check if there's any ELO data in other locations
  console.log('📊 Searching for any ELO-related data in the entire match stats...');
  const searchForElo = (obj: any, path: string = ''): any => {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if this key contains elo information
        if (key.toLowerCase().includes('elo') || key.toLowerCase().includes('rating')) {
          console.log(`Found ELO-related key at ${currentPath}:`, value);
          
          // If it's an array, look for our player
          if (Array.isArray(value)) {
            const playerElo = value.find((item: any) => 
              item && typeof item === 'object' && item.player_id === player.player_id
            );
            if (playerElo) {
              console.log('Found player ELO data at', currentPath, ':', playerElo);
              if (typeof playerElo.elo_change === 'number') {
                return { elo_change: playerElo.elo_change };
              }
              if (playerElo.elo && playerElo.elo.after && playerElo.elo.before) {
                const eloChange = playerElo.elo.after - playerElo.elo.before;
                return { elo_change: eloChange };
              }
            }
          }
          
          // If it's an object, check if it contains our player data
          if (typeof value === 'object' && value !== null && 'player_id' in value) {
            if ((value as any).player_id === player.player_id) {
              console.log('Found player ELO object at', currentPath, ':', value);
              if (typeof (value as any).elo_change === 'number') {
                return { elo_change: (value as any).elo_change };
              }
            }
          }
        }
        
        // Recursive search
        if (typeof value === 'object' && value !== null) {
          const result = searchForElo(value, currentPath);
          if (result) return result;
        }
      }
    }
    return null;
  };
  
  const eloResult = searchForElo(matchStatsData);
  if (eloResult) {
    console.log('✅ Found ELO through deep search:', eloResult);
    return eloResult;
  }
  
  console.log('❌ No ELO change found anywhere in the data');
  console.log('Available top-level keys in matchStatsData:', Object.keys(matchStatsData));
  return null;
};
