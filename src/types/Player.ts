
export interface Player {
  player_id: string;
  nickname: string;
  avatar: string;
  position?: number;
  level?: number;
  elo?: number;
  wins?: number;
  winRate?: number;
  hsRate?: number;
  kdRatio?: number;
  matches?: Match[];
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
}
