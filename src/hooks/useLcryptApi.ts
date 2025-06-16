
import { useState } from 'react';

export const useLcryptApi = () => {
  const [loading, setLoading] = useState(false);

  const getPlayerEloData = async (nickname: string) => {
    setLoading(true);
    try {
      console.log(`[LCRYPT] Fetching ELO data for player: ${nickname}`);
      const response = await fetch(`https://faceit.lcrypt.eu/?n=${encodeURIComponent(nickname)}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[LCRYPT] ELO data received:`, data);
      
      if (data.error) {
        console.error('[LCRYPT] API returned error:', data);
        return null;
      }

      return {
        elo: data.elo || 0,
        level: data.level || '0',
        region: data.region || 'Unknown',
        country: data.country || 'Unknown',
        country_flag: data.country_flag || '',
        region_ranking: data.region_ranking || null,
        country_ranking: data.country_ranking || null,
        ladder_position: data.detail?.ladder?.position || null,
        ladder_points: data.detail?.ladder?.points || null,
        ladder_won: data.detail?.ladder?.won || null,
        ladder_played: data.detail?.ladder?.played || null,
        ladder_win_rate: data.detail?.ladder?.win_rate || null,
        last_match: data.last_match || null,
        trend: data.trend || null
      };
    } catch (error) {
      console.error('[LCRYPT] Error fetching ELO data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getPlayerEloData,
    loading
  };
};
