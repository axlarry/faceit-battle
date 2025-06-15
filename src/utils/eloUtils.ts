
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
  
  // Priority 1: Check direct ELO change in match stats
  if (matchStatsData.elo_change) {
    console.log('🔍 Found elo_change at root level:', matchStatsData.elo_change);
    
    if (Array.isArray(matchStatsData.elo_change)) {
      const playerEloData = matchStatsData.elo_change.find((elo: any) => 
        elo.player_id === player.player_id
      );
      
      if (playerEloData && typeof playerEloData.elo_change === 'number') {
        console.log('✅ Found ELO change in direct array:', playerEloData.elo_change);
        return { elo_change: playerEloData.elo_change };
      }
    }
  }

  // Priority 2: Check in results section
  if (matchStatsData.results) {
    console.log('🔍 Checking results section...');
    
    // Check for elo_changes in results
    if (matchStatsData.results.elo_changes) {
      console.log('Found elo_changes in results:', matchStatsData.results.elo_changes);
      
      if (Array.isArray(matchStatsData.results.elo_changes)) {
        const playerEloData = matchStatsData.results.elo_changes.find((elo: any) => 
          elo.player_id === player.player_id
        );
        
        if (playerEloData && typeof playerEloData.elo_change === 'number') {
          console.log('✅ Found ELO change in results.elo_changes:', playerEloData.elo_change);
          return { elo_change: playerEloData.elo_change };
        }
      }
    }
    
    // Check for player-specific data in results
    if (matchStatsData.results[player.player_id]) {
      const playerResultData = matchStatsData.results[player.player_id];
      console.log('Found player-specific results data:', playerResultData);
      
      if (typeof playerResultData.elo_change === 'number') {
        console.log('✅ Found ELO change in player results:', playerResultData.elo_change);
        return { elo_change: playerResultData.elo_change };
      }
    }
  }

  // Priority 3: Check teams structure for ELO data
  if (matchStatsData.teams) {
    console.log('🔍 Checking teams structure...');
    
    Object.entries(matchStatsData.teams).forEach(([teamId, team]: [string, any]) => {
      console.log(`Checking team ${teamId}:`, team);
      
      if (team.players && Array.isArray(team.players)) {
        const playerData = team.players.find((p: any) => p.player_id === player.player_id);
        
        if (playerData) {
          console.log('Found player in team:', playerData);
          
          // Check various ELO properties
          const eloProperties = [
            'elo_change', 'ELO Change', 'Elo Change', 
            'rating_change', 'Rating Change', 'faceit_elo_change'
          ];
          
          for (const prop of eloProperties) {
            if (playerData[prop] !== undefined) {
              const eloValue = typeof playerData[prop] === 'string' 
                ? parseInt(playerData[prop]) 
                : playerData[prop];
              
              if (typeof eloValue === 'number') {
                console.log(`✅ Found ELO change in teams.${teamId}.players via ${prop}:`, eloValue);
                return { elo_change: eloValue };
              }
            }
          }
          
          // Check player_stats for ELO data
          if (playerData.player_stats) {
            console.log('Checking player_stats for ELO data:', playerData.player_stats);
            
            for (const prop of eloProperties) {
              if (playerData.player_stats[prop] !== undefined) {
                const eloValue = typeof playerData.player_stats[prop] === 'string' 
                  ? parseInt(playerData.player_stats[prop]) 
                  : playerData.player_stats[prop];
                
                if (typeof eloValue === 'number') {
                  console.log(`✅ Found ELO change in player_stats via ${prop}:`, eloValue);
                  return { elo_change: eloValue };
                }
              }
            }
          }
        }
      }
    });
  }

  // Priority 4: Check rounds structure (sometimes ELO is in round data)
  if (matchStatsData.rounds && Array.isArray(matchStatsData.rounds)) {
    console.log('🔍 Checking rounds structure...');
    
    // Check last round for final ELO data
    const lastRound = matchStatsData.rounds[matchStatsData.rounds.length - 1];
    if (lastRound && lastRound.teams) {
      Object.entries(lastRound.teams).forEach(([teamId, team]: [string, any]) => {
        if (team.players && Array.isArray(team.players)) {
          const playerData = team.players.find((p: any) => p.player_id === player.player_id);
          
          if (playerData && playerData.elo_change !== undefined) {
            const eloValue = typeof playerData.elo_change === 'string' 
              ? parseInt(playerData.elo_change) 
              : playerData.elo_change;
            
            if (typeof eloValue === 'number') {
              console.log('✅ Found ELO change in last round:', eloValue);
              return { elo_change: eloValue };
            }
          }
        }
      });
    }
  }

  // Priority 5: Check for any nested ELO data using recursive search
  const searchForEloData = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If this is an object with player_id matching our player
      if (value && typeof value === 'object' && 'player_id' in value) {
        if ((value as any).player_id === player.player_id) {
          console.log(`🎯 Found player data at ${currentPath}:`, value);
          
          // Check for ELO properties
          const eloProps = ['elo_change', 'ELO Change', 'rating_change', 'Rating Change'];
          for (const prop of eloProps) {
            if ((value as any)[prop] !== undefined) {
              const eloValue = typeof (value as any)[prop] === 'string' 
                ? parseInt((value as any)[prop]) 
                : (value as any)[prop];
              
              if (typeof eloValue === 'number') {
                console.log(`✅ Found ELO change via recursive search at ${currentPath}.${prop}:`, eloValue);
                return { elo_change: eloValue };
              }
            }
          }
        }
      }
      
      // Continue recursive search
      if (typeof value === 'object' && value !== null) {
        const result = searchForEloData(value, currentPath);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  console.log('🔍 Starting recursive search for ELO data...');
  const recursiveResult = searchForEloData(matchStatsData);
  if (recursiveResult) {
    return recursiveResult;
  }

  // Priority 6: Check original match object for ELO data
  if (match.teams) {
    console.log('🔍 Checking original match.teams data...');
    
    Object.entries(match.teams).forEach(([teamId, team]) => {
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData && playerData.player_stats) {
        console.log('Found player in original match teams:', playerData);
        
        // Check for ELO in original match player stats
        const eloProps = ['elo_change', 'ELO Change', 'rating_change', 'Rating Change'];
        for (const prop of eloProps) {
          if (playerData.player_stats[prop] !== undefined) {
            const eloValue = typeof playerData.player_stats[prop] === 'string' 
              ? parseInt(playerData.player_stats[prop]) 
              : playerData.player_stats[prop];
            
            if (typeof eloValue === 'number') {
              console.log(`✅ Found ELO change in original match via ${prop}:`, eloValue);
              return { elo_change: eloValue };
            }
          }
        }
      }
    });
  }

  // Priority 7: Check for ELO data in any array at any level
  const findEloInArrays = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (Array.isArray(value)) {
        console.log(`🔍 Checking array ${currentPath} with ${value.length} items`);
        
        // Look for objects with player_id and elo data
        for (const item of value) {
          if (item && typeof item === 'object' && 'player_id' in item) {
            if (item.player_id === player.player_id) {
              console.log(`🎯 Found player in array ${currentPath}:`, item);
              
              // Check all possible ELO properties
              const allEloProps = [
                'elo_change', 'ELO Change', 'Elo Change', 'rating_change', 
                'Rating Change', 'faceit_elo_change', 'elo_diff', 'elo_delta'
              ];
              
              for (const prop of allEloProps) {
                if (item[prop] !== undefined) {
                  const eloValue = typeof item[prop] === 'string' 
                    ? parseInt(item[prop]) 
                    : item[prop];
                  
                  if (typeof eloValue === 'number') {
                    console.log(`✅ Found ELO change in array ${currentPath} via ${prop}:`, eloValue);
                    return { elo_change: eloValue };
                  }
                }
              }
            }
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = findEloInArrays(value, currentPath);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  console.log('🔍 Searching for ELO data in arrays...');
  const arrayResult = findEloInArrays(matchStatsData);
  if (arrayResult) {
    return arrayResult;
  }

  console.log('❌ No ELO change found after exhaustive search');
  console.log('Available top-level keys:', Object.keys(matchStatsData));
  
  // Final attempt: log all available data structures for manual inspection
  console.log('📊 COMPLETE DATA STRUCTURE ANALYSIS:');
  const analyzeForElo = (obj: any, depth: number = 0, maxDepth: number = 3) => {
    if (depth > maxDepth || !obj || typeof obj !== 'object') return;
    
    const indent = '  '.repeat(depth);
    Object.entries(obj).forEach(([key, value]) => {
      if (key.toLowerCase().includes('elo') || key.toLowerCase().includes('rating') || key.toLowerCase().includes('change')) {
        console.log(`${indent}🎯 POTENTIAL ELO KEY: ${key}`, typeof value === 'object' ? '[object/array]' : value);
      }
      
      if (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object') {
        const sampleKeys = Object.keys(value[0]);
        const eloKeys = sampleKeys.filter(k => 
          k.toLowerCase().includes('elo') || 
          k.toLowerCase().includes('rating') || 
          k.toLowerCase().includes('change')
        );
        if (eloKeys.length > 0) {
          console.log(`${indent}📋 Array "${key}" sample ELO keys:`, eloKeys);
        }
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && depth < maxDepth) {
        analyzeForElo(value, depth + 1, maxDepth);
      }
    });
  };
  
  analyzeForElo(matchStatsData);
  
  console.log('=== ELO ANALYSIS END ===');
  return null;
};
