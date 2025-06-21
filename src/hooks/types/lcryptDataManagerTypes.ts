
import { Player } from '@/types/Player';

export interface UseLcryptDataManagerProps {
  friends: Player[];
  enabled?: boolean;
}

export interface FriendWithLcrypt extends Player {
  lcryptData?: any;
  isLive?: boolean;
  liveMatchDetails?: any;
  liveCompetition?: string;
  cover_image?: string;
}

export interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  status?: string;
  state?: string;
  matchDetails?: {
    map?: any;
    server?: any;
    score?: any;
    duration?: any;
    round?: any;
    elo_change?: any;
    result?: any;
    chance?: any;
  };
  liveMatch?: any;
}
