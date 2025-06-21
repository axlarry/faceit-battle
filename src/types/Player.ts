
export interface Player {
  player_id: string;
  nickname: string;
  avatar: string;
  cover_image?: string; // Added cover image field
  position?: number;
  level?: number;
  elo?: number;
  wins?: number;
  winRate?: number;
  hsRate?: number;
  kdRatio?: number;
  matches?: Match[];
  isLive?: boolean;
  liveMatchId?: string;
  liveCompetition?: string;
  liveStatus?: string;
  liveMatchDetails?: any;
}

export interface Match {
  match_id: string;
  competition_name: string;
  competition_type: string;
  game_mode: string;
  max_players: number;
  teams_size: number;
  started_at: number;
  finished_at: number;
  status: string;
  results: {
    winner: string;
    score: {
      [key: string]: number;
    };
  };
  teams: {
    [key: string]: {
      team_id: string;
      nickname: string;
      players: {
        player_id: string;
        nickname: string;
        player_stats: {
          [key: string]: string;
        };
      }[];
    };
  };
  round_stats?: {
    [key: string]: {
      [key: string]: string;
    };
  };
  elo_change?: {
    player_id: string;
    elo_before: number;
    elo_after: number;
    elo_change: number;
  };
  match_details?: {
    map: string;
    score_team1: number;
    score_team2: number;
    rounds_played: number;
  };
  // New properties for live matches
  isLiveMatch?: boolean;
  liveMatchDetails?: any;
}
