/**
 * LcryptOptimizedService — fetches data from faceit.lcrypt.eu via the
 * get-lcrypt-elo edge function (which presents as fossabot web proxy).
 * Falls back to FACEIT match history (playerTodayService) on failure.
 *
 * Uses optimizedApiService.lcryptApiCall so all requests share the
 * 90s client-side memory cache and in-flight deduplication layer.
 */
import { optimizedApiService } from './optimizedApiService';
import { getPlayerTodayData, countryCodeToFlag } from './playerTodayService';
import { parseLcryptReport } from '@/utils/lcryptUtils';

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

// Parse the "today.elo" value which can be:
// - A string like "+14" or "-21" when player has played
// - A number 0 when player hasn't played
function parseEloString(s?: string | number): number {
  if (s == null) return 0;
  // If already a number, return it directly
  if (typeof s === 'number') return s;
  const n = parseInt(s.replace(/\s/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export class LcryptOptimizedService {
  async getCompletePlayerData(
    nickname: string,
    playerId?: string,
    country?: string
  ): Promise<OptimizedLcryptData | null> {
    // Use optimizedApiService so requests share the 90s client cache and
    // in-flight deduplication (no duplicate edge-function calls per player).
    try {
      const data = await optimizedApiService.lcryptApiCall(nickname);
      if (data && data.error !== true) {
        return this.mapLcryptResponse(data, playerId);
      }
    } catch {
      // fall through to FACEIT fallback
    }

    // Fallback: FACEIT match history
    return this.faceitFallback(nickname, playerId, country);
  }

  private mapLcryptResponse(data: any, playerId?: string): OptimizedLcryptData {
    const isLive = data.current?.present === true;

    let liveInfo: OptimizedLcryptData['liveInfo'] | undefined;
    if (isLive) {
      liveInfo = {
        matchId: data.current?.match_id || '',
        competition: data.current?.what || 'FACEIT Match',
        status: data.current?.status || 'LIVE',
        state: 'ONGOING',
        matchDetails: {
          map: data.current?.map,
          server: data.current?.server,
          score: data.current?.score,
          result: data.current?.result,
          elo_change: data.current?.elo,
        },
        liveMatch: {
          match_id: data.current?.match_id || '',
          competition_name: data.current?.what || 'FACEIT Match',
          status: data.current?.status || 'LIVE',
          started_at: Math.floor(Date.now() / 1000),
          finished_at: null,
          teams: {},
          voting: { map: { pick: data.current?.map ? [data.current.map] : [] } },
          isLiveMatch: true,
          liveMatchDetails: data.current || {},
        },
      };
    }

    const todayEloStr: string | undefined = data.today?.elo;
    let todayEloNum = parseEloString(todayEloStr);
    let todayEloWin = typeof data.today?.elo_win === 'number' ? data.today.elo_win : parseEloString(data.today?.elo_win);
    let todayEloLose = typeof data.today?.elo_lose === 'number' ? data.today.elo_lose : parseEloString(data.today?.elo_lose);

    // Fallback: if today.elo is 0 but the player played today, compute from
    // the report string. The lcrypt API sometimes omits or zeros today.elo
    // while still including per-match ELO in the report field.
    if (todayEloNum === 0 && data.today?.present && (data.today?.count ?? 0) > 0 && data.report) {
      const reportMatches = parseLcryptReport(data.report);
      const todayCount = data.today.count as number;
      const todayMatchSlice = reportMatches.slice(0, todayCount);
      if (todayMatchSlice.length > 0) {
        todayEloNum = todayMatchSlice.reduce((sum, m) => sum + m.eloChange, 0);
        if (todayEloWin === 0) {
          todayEloWin = todayMatchSlice
            .filter(m => m.result === 'WIN')
            .reduce((sum, m) => sum + m.eloChange, 0);
        }
        if (todayEloLose === 0) {
          todayEloLose = Math.abs(
            todayMatchSlice
              .filter(m => m.result === 'LOSE')
              .reduce((sum, m) => sum + m.eloChange, 0)
          );
        }
      }
    }

    return {
      elo: data.elo,
      level: data.level != null ? String(data.level) : undefined,
      region: data.region,
      country: data.country,
      country_flag: data.country_flag,
      region_ranking: data.region_ranking,
      country_ranking: data.country_ranking,
      report: typeof data.report === 'string' ? data.report : '',
      today: data.today
        ? {
            present: data.today.present ?? false,
            win: data.today.win ?? 0,
            lose: data.today.lose ?? 0,
            elo: todayEloNum,
            elo_win: todayEloWin,
            elo_lose: todayEloLose,
            count: data.today.count ?? 0,
          }
        : undefined,
      isLive,
      liveInfo,
      rawData: { detail: data.detail },
      error: false,
    };
  }

  private async faceitFallback(
    nickname: string,
    playerId?: string,
    country?: string
  ): Promise<OptimizedLcryptData | null> {
    try {
      if (!playerId) {
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
        elo: undefined,
        level: undefined,
        region: undefined,
        country,
        country_flag,
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
      console.error(`Failed to fetch fallback data for ${nickname}:`, error);
      return { isLive: false, error: true };
    }
  }
}

export const lcryptOptimizedService = new LcryptOptimizedService();
