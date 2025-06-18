
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
  
  // Helper function to search recursively for rank/ELO data
  const findPlayerRankData = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check for rank-related keys at any level
      const rankKeys = [
        'rank', 'ranking', 'skill_level', 'faceit_elo', 'elo', 'rating',
        'level_before', 'level_after', 'elo_before', 'elo_after',
        'rank_before', 'rank_after', 'skill_level_before', 'skill_level_after'
      ];
      
      if (rankKeys.includes(key.toLowerCase())) {
        console.log(`🎯 Found rank-related key "${key}" at ${currentPath}:`, value);
        
        // If this is an array, search for our player
        if (Array.isArray(value)) {
          const playerRankData = value.find((item: any) => 
            item && item.player_id === player.player_id
          );
          if (playerRankData) {
            console.log(`✅ Found player rank data in array:`, playerRankData);
            return playerRankData;
          }
        }
        
        // If this is an object with our player ID, check it
        if (value && typeof value === 'object' && 'player_id' in value) {
          if ((value as any).player_id === player.player_id) {
            console.log(`✅ Found player rank data:`, value);
            return value;
          }
        }
      }
      
      // If this object has a player_id matching our player
      if (value && typeof value === 'object' && 'player_id' in value) {
        if ((value as any).player_id === player.player_id) {
          console.log(`🎯 Found player data at ${currentPath}:`, value);
          
          // Check for rank/ELO properties in this player object
          const allRankProps = [
            'elo_change', 'ELO Change', 'Elo Change', 'rating_change', 'Rating Change',
            'elo_diff', 'elo_delta', 'faceit_elo_change', 'skill_level_change',
            'rank', 'ranking', 'skill_level', 'faceit_elo', 'elo', 'rating',
            'level_before', 'level_after', 'elo_before', 'elo_after',
            'rank_before', 'rank_after', 'skill_level_before', 'skill_level_after'
          ];
          
          for (const prop of allRankProps) {
            if ((value as any)[prop] !== undefined) {
              const rankValue = (value as any)[prop];
              console.log(`🔍 Found rank property ${prop}:`, rankValue);
              
              // Handle different rank value types
              if (typeof rankValue === 'number') {
                // If it's already a number, check if it looks like an ELO change
                if (prop.toLowerCase().includes('change') || prop.toLowerCase().includes('diff') || prop.toLowerCase().includes('delta')) {
                  console.log(`✅ Found ELO change via ${prop}:`, rankValue);
                  return { elo_change: rankValue };
                }
              } else if (typeof rankValue === 'string') {
                const parsedRank = parseInt(rankValue);
                if (!isNaN(parsedRank)) {
                  if (prop.toLowerCase().includes('change') || prop.toLowerCase().includes('diff') || prop.toLowerCase().includes('delta')) {
                    console.log(`✅ Found ELO change via ${prop}:`, parsedRank);
                    return { elo_change: parsedRank };
                  }
                }
              } else if (typeof rankValue === 'object' && rankValue !== null) {
                // Handle nested rank objects
                console.log(`🔍 Rank object found in ${prop}:`, rankValue);
                
                // Check for before/after in rank object
                if ('after' in rankValue && 'before' in rankValue) {
                  const after = typeof rankValue.after === 'string' ? parseInt(rankValue.after) : rankValue.after;
                  const before = typeof rankValue.before === 'string' ? parseInt(rankValue.before) : rankValue.before;
                  
                  if (typeof after === 'number' && typeof before === 'number') {
                    const change = after - before;
                    console.log(`✅ Calculated ELO change from ${prop}: ${before} → ${after} = ${change}`);
                    return { elo_change: change };
                  }
                }
                
                // Check for change property in rank object
                if ('change' in rankValue) {
                  const change = typeof rankValue.change === 'string' ? parseInt(rankValue.change) : rankValue.change;
                  if (typeof change === 'number') {
                    console.log(`✅ Found ELO change in ${prop}.change:`, change);
                    return { elo_change: change };
                  }
                }
              }
            }
          }
          
          // Check in nested objects within player data
          for (const [nestedKey, nestedValue] of Object.entries(value as any)) {
            if (typeof nestedValue === 'object' && nestedValue !== null) {
              console.log(`🔍 Checking nested object ${nestedKey}:`, nestedValue);
              
              for (const prop of allRankProps) {
                if ((nestedValue as any)[prop] !== undefined) {
                  const rankValue = (nestedValue as any)[prop];
                  if (typeof rankValue === 'number' && (prop.toLowerCase().includes('change') || prop.toLowerCase().includes('diff'))) {
                    console.log(`✅ Found ELO change in ${nestedKey}.${prop}:`, rankValue);
                    return { elo_change: rankValue };
                  }
                }
              }
            }
          }
        }
      }
      
      // Continue recursive search
      if (typeof value === 'object' && value !== null) {
        const result = findPlayerRankData(value, currentPath);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  // Priority 1: Look for rank-specific sections first
  console.log('🔍 Searching for rank-specific data structures...');
  
  // Check for rank history or rank changes at root level
  const rankSections = ['rank_history', 'rank_changes', 'ranking', 'ranks', 'player_rankings'];
  for (const section of rankSections) {
    if (matchStatsData[section]) {
      console.log(`🔍 Found ${section} section:`, matchStatsData[section]);
      
      if (Array.isArray(matchStatsData[section])) {
        const playerRankData = matchStatsData[section].find((item: any) => 
          item && item.player_id === player.player_id
        );
        if (playerRankData) {
          console.log(`✅ Found player in ${section}:`, playerRankData);
          
          // Look for ELO change indicators
          for (const key of Object.keys(playerRankData)) {
            if (key.toLowerCase().includes('change') || key.toLowerCase().includes('diff')) {
              const value = playerRankData[key];
              const numValue = typeof value === 'string' ? parseInt(value) : value;
              if (typeof numValue === 'number') {
                console.log(`✅ Found ELO change in ${section}:`, numValue);
                return { elo_change: numValue };
              }
            }
          }
        }
      }
    }
  }
  
  // Priority 2: Direct elo_change array at root level
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
  
  // Priority 3: Check in results for rank data
  if (matchStatsData.results) {
    console.log('🔍 Checking results section...');
    const rankResult = findPlayerRankData(matchStatsData.results, 'results');
    if (rankResult) return rankResult;
  }
  
  // Priority 4: Comprehensive recursive search
  console.log('🔍 Starting comprehensive recursive search...');
  const recursiveResult = findPlayerRankData(matchStatsData);
  if (recursiveResult) {
    return recursiveResult;
  }
  
  // Priority 5: Check match.teams data from the original match object
  if (match.teams) {
    console.log('🔍 Checking original match.teams data...');
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData) {
        console.log('Found player in original match teams:', playerData);
        
        // Check for rank data in original match
        const rankResult = findPlayerRankData(playerData, 'match.teams');
        if (rankResult) return rankResult;
      }
    }
  }
  
  // Priority 6: Log structure analysis for debugging
  console.log('❌ No ELO/Rank change found anywhere');
  console.log('Available top-level keys:', Object.keys(matchStatsData));
  
  // Analyze structure to help identify where rank data might be
  const analyzeStructure = (obj: any, depth: number = 0, maxDepth: number = 3) => {
    if (depth > maxDepth || !obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const indent = '  '.repeat(depth);
      if (key.toLowerCase().includes('rank') || key.toLowerCase().includes('elo') || key.toLowerCase().includes('level')) {
        console.log(`${indent}🎯 POTENTIAL RANK KEY: ${key}`, typeof value === 'object' ? '[object]' : value);
      }
      
      if (Array.isArray(value) && value.length > 0) {
        console.log(`${indent}📋 Array "${key}" with ${value.length} items`);
        if (value[0] && typeof value[0] === 'object') {
          console.log(`${indent}   Sample item keys:`, Object.keys(value[0]));
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log(`${indent}📂 Object "${key}"`);
        analyzeStructure(value, depth + 1, maxDepth);
      }
    });
  };
  
  console.log('📊 STRUCTURE ANALYSIS:');
  analyzeStructure(matchStatsData);
  
  console.log('=== ELO ANALYSIS END ===');
  return null;
};
