
export class LcryptLiveService {
  async checkPlayerLiveFromLcrypt(nickname: string) {
    try {
      console.log(`🔍 Checking Lcrypt live status for: ${nickname}`);
      
      // Make request to our Supabase edge function that calls Lcrypt
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

      // Check if player is currently playing according to Lcrypt
      if (data.current && data.current.present && data.current.status === 'LIVE') {
        console.log(`✅ ${nickname} is LIVE according to Lcrypt`);
        
        // Try to extract match information from Lcrypt data
        const liveMatchInfo = {
          isLive: true,
          matchId: this.extractMatchIdFromLcrypt(data),
          competition: data.current.what || 'Live Match',
          status: 'LIVE',
          state: 'ONGOING',
          matchDetails: {
            map: data.current.map,
            server: data.current.server,
            score: data.current.score,
            duration: data.current.duration,
            round: data.current.round,
            elo_change: data.current.elo
          },
          liveMatch: {
            match_id: this.extractMatchIdFromLcrypt(data),
            competition_name: data.current.what || 'Live Match',
            status: 'LIVE',
            started_at: Date.now() / 1000 - this.parseMinutesToSeconds(data.current.duration),
            finished_at: null,
            teams: {},
            voting: {
              map: {
                pick: [data.current.map]
              }
            }
          }
        };

        return liveMatchInfo;
      }

      return { isLive: false };
    } catch (error) {
      console.warn(`⚠️ Error checking Lcrypt live status for ${nickname}:`, error);
      return { isLive: false };
    }
  }

  private extractMatchIdFromLcrypt(data: any): string {
    // Since Lcrypt doesn't provide match ID directly, we'll generate a placeholder
    // In a real scenario, we might need to parse it from the playing string or use another method
    const timestamp = Date.now();
    return `live-${timestamp}`;
  }

  private parseMinutesToSeconds(duration: string): number {
    if (!duration) return 0;
    const minutes = parseInt(duration.replace("'", "")) || 0;
    return minutes * 60;
  }
}

export const lcryptLiveService = new LcryptLiveService();
