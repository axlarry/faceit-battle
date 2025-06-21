
import { supabase } from '@/integrations/supabase/client';

export class LcryptLiveService {
  async checkPlayerLiveFromLcrypt(nickname: string) {
    try {
      console.log(`🔍 Checking Lcrypt live status for: ${nickname}`);
      
      // Use Supabase function invoke instead of direct fetch
      const { data, error } = await supabase.functions.invoke('get-lcrypt-elo', {
        body: { nickname }
      });

      if (error) {
        console.warn(`Lcrypt API error for ${nickname}:`, error);
        return { isLive: false };
      }

      console.log(`📊 Lcrypt data for ${nickname}:`, data);

      // Check if the response indicates player not found
      if (data?.error === true || data?.message === "player not found") {
        console.log(`❌ Player ${nickname} not found in Lcrypt database`);
        return { isLive: false };
      }

      // Check if player is currently playing using current.present and current.status
      const currentData = data?.current;
      if (currentData && currentData.present === true && currentData.status === 'LIVE') {
        console.log(`✅ ${nickname} is LIVE according to Lcrypt`);
        
        // Create match ID from current timestamp since Lcrypt doesn't provide one
        const matchId = `live-${Date.now()}-${nickname}`;
        
        const liveMatchInfo = {
          isLive: true,
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
            // Mark as live match for special handling
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

        return liveMatchInfo;
      }

      // Also check the "playing" field as a backup
      if (data?.playing && data.playing !== 'nothing' && data.playing.includes('Queue')) {
        console.log(`🎮 ${nickname} might be playing: ${data.playing}`);
        
        // Extract info from playing string if available
        const playingInfo = this.parsePlayingString(data.playing);
        
        const matchId = `live-${Date.now()}-${nickname}`;
        
        const liveMatchInfo = {
          isLive: true,
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

        return liveMatchInfo;
      }

      console.log(`⚪ ${nickname} is not live - current.present: ${currentData?.present}, current.status: ${currentData?.status}, playing: ${data?.playing}`);
      return { isLive: false };
    } catch (error) {
      console.warn(`⚠️ Error checking Lcrypt live status for ${nickname}:`, error);
      return { isLive: false };
    }
  }

  private parseMinutesToSeconds(duration: string): number {
    if (!duration) return 0;
    const minutes = parseInt(duration.replace("'", "")) || 0;
    return minutes * 60;
  }

  private parsePlayingString(playing: string): { queue?: string, map?: string, server?: string, elo?: string } {
    // Parse strings like "FaceIt Europe 5v5 Queue, Ancient (Germany), Elo: +25/-25"
    const parts = playing.split(', ');
    const result: { queue?: string, map?: string, server?: string, elo?: string } = {};
    
    parts.forEach(part => {
      if (part.includes('Queue')) {
        result.queue = part.trim();
      } else if (part.includes('(') && part.includes(')')) {
        // Extract map and server
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

export const lcryptLiveService = new LcryptLiveService();
