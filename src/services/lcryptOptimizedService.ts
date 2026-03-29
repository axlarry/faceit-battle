
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

export interface OptimizedLcryptData {
  elo?: number;
  level?: string;
  region?: string;
  country?: string;
  country_flag?: string;
  region_ranking?: number;
  country_ranking?: number;
  report?: string;
  today?: {
    present: boolean;
    win: number;
    lose: number;
    elo: number;
    elo_win: number;
    elo_lose: number;
    count: number;
  };
  isLive: boolean;
  liveInfo?: {
    matchId: string;
    competition: string;
    status: string;
    state: string;
    matchDetails: {
      map?: any;
      server?: any;
      score?: any;
      duration?: any;
      round?: any;
      elo_change?: any;
      result?: any;
      chance?: any;
    };
    liveMatch: any;
  };
  rawData?: any;
  error?: boolean;
}

export class LcryptOptimizedService {
  async getCompletePlayerData(nickname: string): Promise<OptimizedLcryptData | null> {
    try {
      const { data, error } = await invokeFunction('get-lcrypt-elo', { nickname });

      if (error) {
        console.warn(`Lcrypt API error for ${nickname}:`, error);
        return { isLive: false, error: true };
      }

      if (data?.message === 'player not found' && !data?.elo) {
        return { isLive: false, error: true };
      }

      const liveInfo = this.extractLiveInfo(data, nickname);

      return {
        elo: data?.elo,
        level: data?.level,
        region: data?.region,
        country: data?.country,
        country_flag: data?.country_flag,
        region_ranking: data?.region_ranking,
        country_ranking: data?.country_ranking,
        report: data?.report,
        today: data?.today,
        isLive: liveInfo.isLive,
        liveInfo: liveInfo.isLive ? liveInfo.liveData : undefined,
        rawData: data,
        error: false,
      };
    } catch (error) {
      console.error(`Failed to fetch complete Lcrypt data for ${nickname}:`, error);
      return { isLive: false, error: true };
    }
  }

  private extractLiveInfo(data: any, nickname: string): { isLive: boolean; liveData?: any } {
    const currentData = data?.current;
    if (currentData?.present === true && currentData?.status === 'LIVE') {
      const matchId = `live-${Date.now()}-${nickname}`;
      return {
        isLive: true,
        liveData: {
          matchId,
          competition: currentData.what || 'Live Match',
          status: 'LIVE',
          state: 'ONGOING',
          matchDetails: {
            map: currentData.map,
            server: currentData.server,
            score: currentData.score,
            duration: currentData.duration,
            round: currentData.round,
            elo_change: currentData.elo,
            result: currentData.result,
            chance: currentData.chance,
          },
          liveMatch: {
            match_id: matchId,
            competition_name: currentData.what || 'Live Match',
            status: 'LIVE',
            started_at: Date.now() / 1000 - this.parseMinutesToSeconds(currentData.duration || '0'),
            finished_at: null,
            teams: {},
            voting: { map: { pick: [currentData.map] } },
            lcryptData: currentData,
            fullLcryptData: data,
            isLiveMatch: true,
            liveMatchDetails: {
              map: currentData.map,
              server: currentData.server,
              score: currentData.score,
              duration: currentData.duration,
              round: currentData.round,
              competition: currentData.what,
              elo_change: currentData.elo,
              result: currentData.result,
              chance: currentData.chance,
            },
          },
        },
      };
    }

    // Fallback: check "playing" field
    if (data?.playing && data.playing !== 'nothing' && data.playing.includes('Queue')) {
      const playingInfo = this.parsePlayingString(data.playing);
      const matchId = `live-${Date.now()}-${nickname}`;
      return {
        isLive: true,
        liveData: {
          matchId,
          competition: playingInfo.queue || 'Live Match',
          status: 'LIVE',
          state: 'ONGOING',
          matchDetails: {
            map: playingInfo.map,
            server: playingInfo.server,
            elo_change: playingInfo.elo,
            competition: playingInfo.queue,
          },
          liveMatch: {
            match_id: matchId,
            competition_name: playingInfo.queue || 'Live Match',
            status: 'LIVE',
            started_at: Date.now() / 1000,
            finished_at: null,
            teams: {},
            voting: { map: { pick: [playingInfo.map] } },
            fullLcryptData: data,
            isLiveMatch: true,
            liveMatchDetails: {
              map: playingInfo.map,
              server: playingInfo.server,
              competition: playingInfo.queue,
              elo_change: playingInfo.elo,
            },
          },
        },
      };
    }

    return { isLive: false };
  }

  private parseMinutesToSeconds(duration: string): number {
    if (!duration) return 0;
    return (parseInt(duration.replace("'", '')) || 0) * 60;
  }

  private parsePlayingString(playing: string): { queue?: string; map?: string; server?: string; elo?: string } {
    const parts = playing.split(', ');
    const result: { queue?: string; map?: string; server?: string; elo?: string } = {};
    for (const part of parts) {
      if (part.includes('Queue')) {
        result.queue = part.trim();
      } else if (part.includes('(') && part.includes(')')) {
        const mapMatch = part.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (mapMatch) {
          result.map = mapMatch[1].trim();
          result.server = mapMatch[2].trim();
        }
      } else if (part.includes('Elo:')) {
        result.elo = part.replace('Elo:', '').trim();
      }
    }
    return result;
  }
}

export const lcryptOptimizedService = new LcryptOptimizedService();
