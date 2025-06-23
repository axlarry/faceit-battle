
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedLcryptData {
  // Datele ELO și statistici generale
  elo?: number;
  level?: string;
  region?: string;
  country?: string;
  country_flag?: string;
  region_ranking?: number;
  country_ranking?: number;
  report?: string;
  
  // Datele pentru astăzi
  today?: {
    present: boolean;
    win: number;
    lose: number;
    elo: number;
    elo_win: number;
    elo_lose: number;
    count: number;
  };
  
  // Informații despre statusul live
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
  
  // Datele complete raw pentru debugging
  rawData?: any;
  error?: boolean;
}

export class LcryptOptimizedService {
  async getCompletePlayerData(nickname: string): Promise<OptimizedLcryptData | null> {
    try {
      console.log(`🔍 Fetching complete Lcrypt data for nickname: ${nickname}`);
      
      const { data, error } = await supabase.functions.invoke('get-lcrypt-elo', {
        body: { nickname }
      });

      if (error) {
        console.warn(`Lcrypt API error for ${nickname}:`, error);
        return { isLive: false, error: true };
      }

      if (data?.error === true || data?.message === "player not found") {
        console.log(`❌ Player ${nickname} not found in Lcrypt database`);
        return { isLive: false, error: true };
      }

      console.log(`📊 Complete Lcrypt data for ${nickname}:`, data);

      // Procesează datele live din același răspuns
      const liveInfo = this.extractLiveInfo(data, nickname);
      
      // Construiește obiectul optimizat cu toate datele
      const optimizedData: OptimizedLcryptData = {
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
        error: false
      };

      console.log(`✅ Successfully processed complete data for ${nickname}: ELO=${optimizedData.elo}, Live=${optimizedData.isLive}`);
      return optimizedData;
    } catch (error) {
      console.error(`❌ Failed to fetch complete Lcrypt data for ${nickname}:`, error);
      return { isLive: false, error: true };
    }
  }

  private extractLiveInfo(data: any, nickname: string): { isLive: boolean; liveData?: any } {
    // Verifică dacă jucătorul este live folosind current.present și current.status
    const currentData = data?.current;
    if (currentData && currentData.present === true && currentData.status === 'LIVE') {
      console.log(`✅ ${nickname} is LIVE according to Lcrypt`);
      
      const matchId = `live-${Date.now()}-${nickname}`;
      
      const liveData = {
        matchId: matchId,
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
          chance: currentData.chance
        },
        liveMatch: {
          match_id: matchId,
          competition_name: currentData.what || 'Live Match',
          status: 'LIVE',
          started_at: Date.now() / 1000 - this.parseMinutesToSeconds(currentData.duration || '0'),
          finished_at: null,
          teams: {},
          voting: {
            map: {
              pick: [currentData.map]
            }
          },
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
            chance: currentData.chance
          }
        }
      };

      return { isLive: true, liveData };
    }

    // Verifică și câmpul "playing" ca backup
    if (data?.playing && data.playing !== 'nothing' && data.playing.includes('Queue')) {
      console.log(`🎮 ${nickname} might be playing: ${data.playing}`);
      
      const playingInfo = this.parsePlayingString(data.playing);
      const matchId = `live-${Date.now()}-${nickname}`;
      
      const liveData = {
        matchId: matchId,
        competition: playingInfo.queue || 'Live Match',
        status: 'LIVE',
        state: 'ONGOING',
        matchDetails: {
          map: playingInfo.map,
          server: playingInfo.server,
          elo_change: playingInfo.elo,
          competition: playingInfo.queue
        },
        liveMatch: {
          match_id: matchId,
          competition_name: playingInfo.queue || 'Live Match',
          status: 'LIVE',
          started_at: Date.now() / 1000,
          finished_at: null,
          teams: {},
          voting: {
            map: {
              pick: [playingInfo.map]
            }
          },
          fullLcryptData: data,
          isLiveMatch: true,
          liveMatchDetails: {
            map: playingInfo.map,
            server: playingInfo.server,
            competition: playingInfo.queue,
            elo_change: playingInfo.elo
          }
        }
      };

      return { isLive: true, liveData };
    }

    console.log(`⚪ ${nickname} is not live - current.present: ${currentData?.present}, current.status: ${currentData?.status}, playing: ${data?.playing}`);
    return { isLive: false };
  }

  private parseMinutesToSeconds(duration: string): number {
    if (!duration) return 0;
    const minutes = parseInt(duration.replace("'", "")) || 0;
    return minutes * 60;
  }

  private parsePlayingString(playing: string): { queue?: string, map?: string, server?: string, elo?: string } {
    const parts = playing.split(', ');
    const result: { queue?: string, map?: string, server?: string, elo?: string } = {};
    
    parts.forEach(part => {
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
    });
    
    return result;
  }
}

export const lcryptOptimizedService = new LcryptOptimizedService();
