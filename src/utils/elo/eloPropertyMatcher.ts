
export const ELO_PROPERTY_NAMES = [
  'elo_change', 'ELO Change', 'Elo Change', 'rating_change', 
  'Rating Change', 'faceit_elo_change', 'elo_diff', 'elo_delta'
];

export const extractEloValue = (obj: any, properties: string[] = ELO_PROPERTY_NAMES): number | null => {
  for (const prop of properties) {
    if (obj[prop] !== undefined) {
      const eloValue = typeof obj[prop] === 'string' 
        ? parseInt(obj[prop]) 
        : obj[prop];
      
      if (typeof eloValue === 'number') {
        return eloValue;
      }
    }
  }
  return null;
};

export const findPlayerEloInArray = (array: any[], playerId: string): { elo_change: number } | null => {
  if (!Array.isArray(array)) return null;
  
  for (const item of array) {
    if (item && typeof item === 'object' && 'player_id' in item) {
      if (item.player_id === playerId) {
        const eloValue = extractEloValue(item);
        if (eloValue !== null) {
          return { elo_change: eloValue };
        }
      }
    }
  }
  
  return null;
};
