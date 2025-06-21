
export class LcryptLiveService {
  async checkPlayerLiveFromLcrypt(nickname: string) {
    try {
      console.log(`🔍 Checking Lcrypt live status for: ${nickname}`);
      
      // Use the same Supabase edge function that's used for ELO fetching
      const response = await fetch('/api/functions/v1/get-lcrypt-elo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname })
      });

      if (!response.ok) {
        console.warn(`Lcrypt API error for ${nickname}:`, response.status);
        return { isLive: false };
      }

      const data = await response.json();
      console.log(`📊 Lcrypt data for ${nickname}:`, data);

      // Check if player is currently playing using current.present and current.status
      if (data.current && data.current.present === true && data.current.status === 'LIVE') {
        console.log(`✅ ${nickname} is LIVE according to Lcrypt`);
        
        // Create match ID from current timestamp since Lcrypt doesn't provide one
        const matchId = `live-${Date.now()}`;
        
        const liveMatchInfo = {
          isLive: true,
          matchId: matchId,
          competition: data.current.what || 'Live Match',
          status: 'LIVE',
          state: 'ONGOING',
          matchDetails: {
            map: data.current.map,
            server: data.current.server,
            score: data.current.score,
            duration: data.current.duration,
            round: data.current.round,
            elo_change: data.current.elo,
            result: data.current.result,
            chance: data.current.chance
          },
          liveMatch: {
            match_id: matchId,
            competition_name: data.current.what || 'Live Match',
            status: 'LIVE',
            started_at: Date.now() / 1000 - this.parseMinutesToSeconds(data.current.duration),
            finished_at: null,
            teams: {},
            voting: {
              map: {
                pick: [data.current.map]
              }
            },
            lcryptData: data.current,
            fullLcryptData: data // Store complete Lcrypt response
          }
        };

        return liveMatchInfo;
      }

      console.log(`⚪ ${nickname} is not live - current.present: ${data.current?.present}, current.status: ${data.current?.status}`);
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
}

export const lcryptLiveService = new LcryptLiveService();
