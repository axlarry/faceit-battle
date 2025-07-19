export interface FaceitAnalyserStats {
  rating: number;
  kast: number;
  impactScore: number;
  adr: number;
  clutchSuccess: number;
  entryKillRate: number;
  tradeKillRate: number;
  multiKillRounds: number;
  pistolRoundWinRate: number;
  ecoRoundWinRate: number;
  forceRoundWinRate: number;
}

export interface MapPerformance {
  mapName: string;
  matches: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgKD: number;
  avgRating: number;
  avgADR: number;
  avgKAST: number;
}

export interface DataPoint {
  date: string;
  value: number;
  matches?: number;
}

export interface PlayerGraphsData {
  eloHistory: DataPoint[];
  ratingTrend: DataPoint[];
  kdTrend: DataPoint[];
  winRateTrend: DataPoint[];
  performanceHeatmap: {
    map: string;
    performance: number;
    matches: number;
  }[];
}

export interface FaceitAnalyserPlayerData {
  playerId: string;
  nickname: string;
  stats?: FaceitAnalyserStats;
  mapStats?: MapPerformance[];
  graphs?: PlayerGraphsData;
  lastUpdated: string;
}

export interface MatchPlayerRating {
  playerId: string;
  nickname: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  rating: number;
  kast: number;
  adr: number;
  impactScore: number;
  entryKills: number;
  clutchWins: number;
  clutchAttempts: number;
}

export interface TeamStats {
  faction1: {
    name: string;
    avgRating: number;
    totalKills: number;
    totalDeaths: number;
    avgADR: number;
    avgKAST: number;
    teamScore: number;
  };
  faction2: {
    name: string;
    avgRating: number;
    totalKills: number;
    totalDeaths: number;
    avgADR: number;
    avgKAST: number;
    teamScore: number;
  };
}

export interface RoundData {
  roundNumber: number;
  winnerFaction: string;
  roundType: 'pistol' | 'eco' | 'force' | 'full';
  mvpPlayer: string;
  duration: number;
}

export interface MapInsights {
  mapName: string;
  avgRoundDuration: number;
  pistolRoundWinRate: {
    faction1: number;
    faction2: number;
  };
  economyBreaks: number;
  comebackRounds: number;
  clutchSituations: number;
}

export interface MatchAnalysisData {
  matchId: string;
  playerRatings: MatchPlayerRating[];
  teamComparison: TeamStats;
  roundAnalysis?: RoundData[];
  mapInsights: MapInsights;
  lastUpdated: string;
}

export interface CacheEntry {
  playerId: string;
  cacheType: 'player_stats' | 'player_graphs' | 'match_analysis';
  data: any;
  expiresAt: string;
  createdAt: string;
}