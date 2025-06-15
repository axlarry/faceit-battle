
import { Player, Match } from "@/types/Player";

export const getEloChange = (match: Match, player: Player, matchesStats: {[key: string]: any}) => {
  console.log('=== ELO ANALYSIS START ===');
  console.log('Match ID:', match.match_id);
  console.log('Player ID:', player.player_id);
  
  const matchStatsData = matchesStats[match.match_id];
  if (!matchStatsData) {
    console.log('❌ No match stats data available');
    return null;
  }
  
  console.log('🔍 FULL MATCH DATA STRUCTURE:');
  console.log(JSON.stringify(matchStatsData, null, 2));
  
  // Helper function to search recursively for ELO data
  const findPlayerEloData = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If this object has a player_id matching our player
      if (value && typeof value === 'object' && 'player_id' in value) {
        if ((value as any).player_id === player.player_id) {
          console.log(`🎯 Found player data at ${currentPath}:`, value);
          
          // Check various ELO properties
          const eloProps = [
            'elo_change', 'ELO Change', 'Elo Change', 'rating_change', 'Rating Change',
            'elo_diff', 'elo_delta', 'faceit_elo_change', 'skill_level_change'
          ];
          
          for (const prop of eloProps) {
            if ((value as any)[prop] !== undefined) {
              const eloValue = (value as any)[prop];
              const parsedElo = typeof eloValue === 'string' ? parseInt(eloValue) : eloValue;
              if (typeof parsedElo === 'number' && !isNaN(parsedElo)) {
                console.log(`✅ Found ELO change via ${prop}:`, parsedElo);
                return { elo_change: parsedElo };
              }
            }
          }
          
          // Check for elo object with before/after
          if ((value as any).elo) {
            const eloObj = (value as any).elo;
            console.log('📊 ELO object found:', eloObj);
            
            if (typeof eloObj.after === 'number' && typeof eloObj.before === 'number') {
              const eloChange = eloObj.after - eloObj.before;
              console.log(`✅ Calculated ELO change from before/after: ${eloObj.before} → ${eloObj.after} = ${eloChange}`);
              return { elo_change: eloChange };
            }
          }
          
          // Check in player_stats
          if ((value as any).player_stats) {
            const stats = (value as any).player_stats;
            console.log('📈 Player stats found:', stats);
            
            for (const prop of eloProps) {
              if (stats[prop] !== undefined) {
                const eloValue = stats[prop];
                const parsedElo = typeof eloValue === 'string' ? parseInt(eloValue) : eloValue;
                if (typeof parsedElo === 'number' && !isNaN(parsedElo)) {
                  console.log(`✅ Found ELO change in player_stats via ${prop}:`, parsedElo);
                  return { elo_change: parsedElo };
                }
              }
            }
          }
        }
      }
      
      // Continue recursive search
      if (typeof value === 'object' && value !== null) {
        const result = findPlayerEloData(value, currentPath);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  // Priority 1: Direct elo_change array at root level
  if (matchStatsData.elo_change && Array.isArray(matchStatsData.elo_change)) {
    console.log('🔍 Checking root level elo_change array...');
    const playerEloData = matchStatsData.elo_change.find((elo: any) => 
      elo.player_id === player.player_id
    );
    
    if (playerEloData) {
      console.log('Found player in elo_change array:', playerEloData);
      if (typeof playerEloData.elo_change === 'number') {
        console.log('✅ ELO change from root elo_change array:', playerEloData.elo_change);
        return { elo_change: playerEloData.elo_change };
      }
    }
  }
  
  // Priority 2: Check in results.elo_changes
  if (matchStatsData.results?.elo_changes) {
    console.log('🔍 Checking results.elo_changes...');
    console.log('ELO changes data:', matchStatsData.results.elo_changes);
    
    if (Array.isArray(matchStatsData.results.elo_changes)) {
      const playerEloData = matchStatsData.results.elo_changes.find((elo: any) => 
        elo.player_id === player.player_id
      );
      
      if (playerEloData && typeof playerEloData.elo_change === 'number') {
        console.log('✅ ELO change from results.elo_changes:', playerEloData.elo_change);
        return { elo_change: playerEloData.elo_change };
      }
    }
  }
  
  // Priority 3: Comprehensive recursive search
  console.log('🔍 Starting comprehensive recursive search...');
  const recursiveResult = findPlayerEloData(matchStatsData);
  if (recursiveResult) {
    return recursiveResult;
  }
  
  // Priority 4: Check match.teams data from the original match object
  if (match.teams) {
    console.log('🔍 Checking original match.teams data...');
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData?.player_stats) {
        console.log('Player stats in original match:', playerData.player_stats);
        
        const eloProps = [
          'elo_change', 'ELO Change', 'Elo Change', 'rating_change', 'Rating Change',
          'elo_diff', 'elo_delta', 'faceit_elo_change'
        ];
        
        for (const prop of eloProps) {
          if (playerData.player_stats[prop] !== undefined) {
            const eloValue = playerData.player_stats[prop];
            const parsedElo = typeof eloValue === 'string' ? parseInt(eloValue) : eloValue;
            if (typeof parsedElo === 'number' && !isNaN(parsedElo)) {
              console.log(`✅ Found ELO change in match.teams via ${prop}:`, parsedElo);
              return { elo_change: parsedElo };
            }
          }
        }
      }
    }
  }
  
  // Priority 5: Log available keys to help debug
  console.log('❌ No ELO change found anywhere');
  console.log('Available top-level keys:', Object.keys(matchStatsData));
  
  // Log some sample data structures to help understand the API response
  if (matchStatsData.teams) {
    console.log('Teams keys:', Object.keys(matchStatsData.teams));
    const firstTeam = Object.values(matchStatsData.teams)[0] as any;
    if (firstTeam?.players?.[0]) {
      console.log('Sample player structure:', firstTeam.players[0]);
    }
  }
  
  if (matchStatsData.rounds?.[0]) {
    console.log('Sample round structure keys:', Object.keys(matchStatsData.rounds[0]));
  }
  
  console.log('=== ELO ANALYSIS END ===');
  return null;
};
