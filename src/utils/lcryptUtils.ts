
export interface LcryptMatchData {
  result: 'WIN' | 'LOSE';
  score: string;
  map: string;
  eloChange: number;
}

export const parseLcryptReport = (report: string): LcryptMatchData[] => {
  if (!report) return [];
  
  // Split by comma and parse each match
  const matches = report.split(', ');
  
  return matches.map(match => {
    // Parse format: "WIN 13:10 Mirage (+30)" or "LOSE 13:3 Dust II (-14)"
    const regex = /(WIN|LOSE)\s+(\d+:\d+)\s+(.+?)\s+\(([+-]\d+)\)/;
    const matchResult = match.match(regex);
    
    if (matchResult) {
      return {
        result: matchResult[1] as 'WIN' | 'LOSE',
        score: matchResult[2],
        map: matchResult[3],
        eloChange: parseInt(matchResult[4])
      };
    }
    
    return null;
  }).filter(Boolean) as LcryptMatchData[];
};

export const findMatchEloChange = (
  match: any,
  lcryptMatches: LcryptMatchData[],
  matchIndex: number
): number | null => {
  // Try to match by index first (most recent matches should be in order)
  if (lcryptMatches[matchIndex]) {
    return lcryptMatches[matchIndex].eloChange;
  }
  
  // Fallback: try to match by map name and result
  const matchScore = match.results?.score;
  const isWin = matchScore && match.results?.winner;
  
  if (isWin !== undefined) {
    const resultType = isWin ? 'WIN' : 'LOSE';
    const matchingLcryptMatch = lcryptMatches.find(lcryptMatch => 
      lcryptMatch.result === resultType
    );
    
    if (matchingLcryptMatch) {
      return matchingLcryptMatch.eloChange;
    }
  }
  
  return null;
};
