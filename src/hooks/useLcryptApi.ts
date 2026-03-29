
import { useState, useEffect } from 'react';
import { lcryptOptimizedService } from '@/services/lcryptOptimizedService';

interface LcryptEloData {
  elo: number;
  level: string;
  region: string;
  country: string;
  country_flag: string;
  region_ranking: number;
  country_ranking: number;
  report: string;
  today?: {
    present: boolean;
    win: number;
    lose: number;
    elo: number;
    elo_win: number;
    elo_lose: number;
    count: number;
  };
  detail?: any;
  error: boolean;
}

export const useLcryptApi = (nickname: string, playerId?: string, country?: string) => {
  const [data, setData] = useState<LcryptEloData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nickname) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await lcryptOptimizedService.getCompletePlayerData(
          nickname,
          playerId,
          country
        );

        if (!result || result.error === true) {
          throw new Error('Failed to fetch player data');
        }

        setData({
          elo: result.elo || 0,
          level: result.level || '',
          region: result.region || '',
          country: result.country || '',
          country_flag: result.country_flag || '',
          region_ranking: result.region_ranking || 0,
          country_ranking: result.country_ranking || 0,
          report: result.report || '',
          today: result.today,
          detail: result.rawData?.detail,
          error: false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nickname, playerId]);

  return { data, loading, error };
};
