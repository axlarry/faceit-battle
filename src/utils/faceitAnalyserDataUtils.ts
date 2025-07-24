// Utility functions to transform FaceitAnalyser API data to our app format

export const transformMatchData = (match: any) => {
  return {
    match_id: match.matchId || match._id?.matchId,
    status: match.status || 'finished',
    started_at: match.date ? new Date(match.date).getTime() : Date.now(),
    finished_at: match.updated_at || Date.now(),
    map: match.map || match.i1,
    score: match.s || match.i18,
    
    // Player stats from match
    playerStats: {
      kills: parseInt(match.k || match.i6 || '0'),
      deaths: parseInt(match.d || match.i8 || '0'),
      assists: parseInt(match.a || match.i7 || '0'),
      headshots: parseInt(match.i13 || '0'),
      mvps: parseInt(match.i9 || '0'),
      rounds: parseInt(match.i12 || '0'),
      kdr: parseFloat(match.kdr || match.c3 || '0'),
      krr: parseFloat(match.c2 || '0'),
      headshotPercent: parseFloat(match.c4 || '0'),
      hltv: parseFloat(match.hltv || '0'),
    },
    
    // Match details
    region: match.i0,
    firstHalfScore: match.i3,
    secondHalfScore: match.i4,
    team: match.i5,
    winResult: match.w || match.i10,
    overtimeRounds: match.i19,
    premade: match.premade,
    gameMode: match.gameMode,
    bestOf: match.bestOf,
    
    // ELO change
    eloChange: parseInt(match.elod || '0'),
    
    // URL and demo
    url: match.url,
    demoUrl: match.url, // FaceitAnalyser might not have separate demo URLs
  };
};

export const transformPlayerStats = (stats: any) => {
  if (!stats) return null;
  
  return {
    // Basic stats
    matches: stats.m || 0,
    wins: stats.w || 0,
    losses: stats.l || 0,
    winRate: stats.wr || 0,
    
    // KDA stats
    kills: stats.k || 0,
    deaths: stats.d || 0,
    assists: stats.a || 0,
    kdr: stats.kdr || 0,
    avgKills: stats.avg_k || 0,
    avgDeaths: stats.avg_d || 0,
    
    // Other stats
    headshots: stats.hs || 0,
    headshotPercent: stats.hsp || 0,
    rounds: stats.r || 0,
    krr: stats.krr || 0,
    
    // ELO stats
    currentElo: stats.current_elo || 0,
    averageElo: stats.avg_elo || 0,
    highestElo: stats.highest_elo || 0,
    lowestElo: stats.lowest_elo || 0,
    
    // HLTV rating
    hltvRating: stats.hltv || 0,
    avgHltv: stats.avg_hltv || 0,
    
    // Dates
    firstMatch: stats.first_occurrence,
    lastMatch: stats.last_occurrence,
  };
};

export const calculateKDA = (kills: number, deaths: number, assists: number) => {
  return `${kills}/${deaths}/${assists}`;
};

export const calculateKDRatio = (kills: number, deaths: number) => {
  return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
};

export const calculateHeadshotPercentage = (headshots: number, kills: number) => {
  return kills > 0 ? Math.round((headshots / kills) * 100) : 0;
};

export const calculateADR = (totalDamage: number, rounds: number) => {
  return rounds > 0 ? Math.round(totalDamage / rounds) : 0;
};
