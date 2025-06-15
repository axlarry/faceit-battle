
export const analyzeDataStructureForElo = (matchStatsData: any) => {
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
};

export const logMatchAnalysis = (match: any, player: any, matchStatsData: any) => {
  console.log('=== ELO ANALYSIS START ===');
  console.log('Match ID:', match.match_id);
  console.log('Player ID:', player.player_id);
  
  if (!matchStatsData) {
    console.log('❌ No match stats data available');
    return false;
  }
  
  console.log('🔍 FULL MATCH DATA STRUCTURE:');
  console.log(JSON.stringify(matchStatsData, null, 2));
  
  return true;
};

export const logAnalysisEnd = (matchStatsData: any) => {
  console.log('❌ No ELO change found after exhaustive search');
  console.log('Available top-level keys:', Object.keys(matchStatsData));
  
  analyzeDataStructureForElo(matchStatsData);
  
  console.log('=== ELO ANALYSIS END ===');
};
