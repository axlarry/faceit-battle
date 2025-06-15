
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
  
  console.log('Full match stats data for ELO analysis:', JSON.stringify(matchStatsData, null, 2));
  
  // Priority 1: Check direct elo_change in match stats
  if (matchStatsData.elo_change && Array.isArray(matchStatsData.elo_change)) {
    console.log('📊 Checking direct elo_change array...');
    const playerEloData = matchStatsData.elo_change.find((elo: any) => 
      elo.player_id === player.player_id
    );
    
    if (playerEloData && typeof playerEloData.elo_change === 'number') {
      console.log('✅ ELO change from direct elo_change:', playerEloData.elo_change);
      return { elo_change: playerEloData.elo_change };
    }
  }
  
  // Priority 2: Check in player stats within teams
  if (matchStatsData.teams) {
    console.log('📊 Checking teams for player ELO data...');
    for (const team of Object.values(matchStatsData.teams) as any[]) {
      if (team.players) {
        const playerData = team.players.find((p: any) => p.player_id === player.player_id);
        if (playerData) {
          console.log('Found player data in team:', playerData);
          
          // Check direct elo_change property
          if (typeof playerData.elo_change === 'number') {
            console.log('✅ ELO change from team player data:', playerData.elo_change);
            return { elo_change: playerData.elo_change };
          }
          
          // Check in player_stats
          if (playerData.player_stats) {
            if (typeof playerData.player_stats.elo_change === 'number') {
              console.log('✅ ELO change from player_stats:', playerData.player_stats.elo_change);
              return { elo_change: playerData.player_stats.elo_change };
            }
            
            // Try parsing as string
            if (typeof playerData.player_stats.elo_change === 'string') {
              const eloChange = parseInt(playerData.player_stats.elo_change);
              if (!isNaN(eloChange)) {
                console.log('✅ ELO change parsed from string:', eloChange);
                return { elo_change: eloChange };
              }
            }
          }
          
          // Check elo object with before/after
          if (playerData.elo) {
            if (typeof playerData.elo.after === 'number' && typeof playerData.elo.before === 'number') {
              const eloChange = playerData.elo.after - playerData.elo.before;
              console.log('✅ Calculated ELO change from before/after:', eloChange);
              return { elo_change: eloChange };
            }
          }
        }
      }
    }
  }
  
  // Priority 3: Check rounds data more thoroughly
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
                console.log('✅ Calculated ELO change from rounds before/after:', eloChange);
                return { elo_change: eloChange };
              }
            }
          }
        }
      }
    }
  }
  
  // Priority 4: Check match.teams data
  if (match.teams) {
    console.log('📊 Checking match.teams for ELO data...');
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData && playerData.player_stats) {
        console.log('Player stats in match teams:', playerData.player_stats);
        
        // Check various ELO fields
        const eloFields = ['elo_change', 'Elo Change', 'ELO Change', 'rating_change', 'Rating Change'];
        for (const field of eloFields) {
          if (playerData.player_stats[field]) {
            const eloValue = playerData.player_stats[field];
            const eloChange = typeof eloValue === 'string' ? parseInt(eloValue) : eloValue;
            if (typeof eloChange === 'number' && !isNaN(eloChange)) {
              console.log(`✅ ELO change from field ${field}:`, eloChange);
              return { elo_change: eloChange };
            }
          }
        }
      }
    }
  }
  
  // Priority 5: Deep search for any ELO-related data
  console.log('📊 Performing deep search for ELO data...');
  const deepSearch = (obj: any, path: string = ''): any => {
    if (typeof obj !== 'object' || obj === null) return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if this is our player's data
      if (typeof value === 'object' && value !== null && 'player_id' in value) {
        if ((value as any).player_id === player.player_id) {
          console.log(`Found player data at ${currentPath}:`, value);
          
          // Check for ELO change
          if (typeof (value as any).elo_change === 'number') {
            return { elo_change: (value as any).elo_change };
          }
          
          // Check ELO object
          if ((value as any).elo && typeof (value as any).elo.after === 'number' && typeof (value as any).elo.before === 'number') {
            const eloChange = (value as any).elo.after - (value as any).elo.before;
            return { elo_change: eloChange };
          }
        }
      }
      
      // Continue recursive search
      if (typeof value === 'object' && value !== null) {
        const result = deepSearch(value, currentPath);
        if (result) return result;
      }
    }
    return null;
  };
  
  const deepResult = deepSearch(matchStatsData);
  if (deepResult) {
    console.log('✅ Found ELO through deep search:', deepResult);
    return deepResult;
  }
  
  console.log('❌ No ELO change found anywhere in the data');
  console.log('Available keys in matchStatsData:', Object.keys(matchStatsData));
  
  // Log some sample data to help debug
  if (matchStatsData.teams) {
    console.log('Sample team data:', Object.values(matchStatsData.teams)[0]);
  }
  
  return null;
};
