/**
 * LcryptOptimizedService — was previously backed by faceit.lcrypt.eu (now shut down).
 * Data is now sourced from the FACEIT API directly via playerTodayService.
 */
import { getPlayerTodayData, countryCodeToFlag } from './playerTodayService';

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
  /**
   * @param nickname  Player nickname (kept for API compatibility)
   * @param playerId  FACEIT player ID — required to fetch today stats & live status
   * @param country   ISO 3166-1 alpha-2 country code from FACEIT player data (e.g. "ro")
   */
  async getCompletePlayerData(
    nickname: string,
    playerId?: string,
    country?: string
  ): Promise<OptimizedLcryptData | null> {
    try {
      if (!playerId) {
        // Without a player ID we can't fetch FACEIT data
        return { isLive: false, error: false };
      }

      const todayResult = await getPlayerTodayData(playerId);

      const country_flag = country ? countryCodeToFlag(country) : undefined;

      let liveInfo: OptimizedLcryptData['liveInfo'] | undefined;
      if (todayResult?.isLive && todayResult.liveMatchId) {
        const matchId = todayResult.liveMatchId;
        liveInfo = {
          matchId,
          competition: 'FACEIT Match',
          status: 'LIVE',
          state: 'ONGOING',
          matchDetails: {},
          liveMatch: {
            match_id: matchId,
            competition_name: 'FACEIT Match',
            status: 'LIVE',
            started_at: Math.floor(Date.now() / 1000),
            finished_at: null,
            teams: {},
            voting: { map: { pick: [] } },
            isLiveMatch: true,
            liveMatchDetails: {},
          },
        };
      }

      return {
        // ELO and level come from FACEIT API in friendDataProcessor (not from here)
        elo: undefined,
        level: undefined,
        region: undefined,
        country,
        country_flag,
        // Rankings not available without lcrypt
        region_ranking: undefined,
        country_ranking: undefined,
        report: todayResult?.report,
        today: todayResult?.today ?? undefined,
        isLive: todayResult?.isLive ?? false,
        liveInfo,
        rawData: null,
        error: false,
      };
    } catch (error) {
      console.error(`Failed to fetch today data for ${nickname}:`, error);
      return { isLive: false, error: true };
    }
  }
}

export const lcryptOptimizedService = new LcryptOptimizedService();
