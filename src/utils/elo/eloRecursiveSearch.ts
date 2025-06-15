
import { Player } from "@/types/Player";
import { extractEloValue, findPlayerEloInArray, ELO_PROPERTY_NAMES } from "./eloPropertyMatcher";

export const searchRecursiveEloData = (matchStatsData: any, player: Player) => {
  console.log('🔍 Strategy 5: Starting recursive search for ELO data...');
  
  const searchForEloData = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If this is an object with player_id matching our player
      if (value && typeof value === 'object' && 'player_id' in value) {
        if ((value as any).player_id === player.player_id) {
          console.log(`🎯 Found player data at ${currentPath}:`, value);
          
          const eloValue = extractEloValue(value as any);
          if (eloValue !== null) {
            console.log(`✅ Found ELO change via recursive search at ${currentPath}:`, eloValue);
            return { elo_change: eloValue };
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
  
  return searchForEloData(matchStatsData);
};

export const searchEloInArrays = (matchStatsData: any, player: Player) => {
  console.log('🔍 Strategy 7: Searching for ELO data in arrays...');
  
  const findEloInArrays = (obj: any, path: string = ''): any => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (Array.isArray(value)) {
        console.log(`🔍 Checking array ${currentPath} with ${value.length} items`);
        
        const result = findPlayerEloInArray(value, player.player_id);
        if (result) {
          console.log(`✅ Found ELO change in array ${currentPath}:`, result.elo_change);
          return result;
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = findEloInArrays(value, currentPath);
        if (result) return result;
      }
    }
    
    return null;
  };
  
  return findEloInArrays(matchStatsData);
};
