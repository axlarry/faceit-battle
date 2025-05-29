
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
}
