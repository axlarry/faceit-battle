
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
  detail?: {
    ladder?: {
      position: number;
      region: string;
      division: string;
      points: number;
      won: number;
      played: number;
      win_rate: number;
    };
  };
  error: boolean;
}

export const useLcryptApi = (nickname: string) => {
  const [data, setData] = useState<LcryptEloData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nickname) return;

    const fetchEloData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🚀 OPTIMIZED: Fetching complete ELO data for nickname: ${nickname}`);
        
        // Folosește serviciul optimizat pentru un singur apel
        const result = await lcryptOptimizedService.getCompletePlayerData(nickname);

        if (result?.error) {
          throw new Error('Failed to fetch ELO data');
        }

        // Convertește datele optimizate la formatul așteptat de hook
        if (result) {
          const convertedData: LcryptEloData = {
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
            error: false
          };

          console.log('OPTIMIZED Lcrypt ELO data received:', convertedData);
          setData(convertedData);
        }
      } catch (err) {
        console.error('Error fetching OPTIMIZED lcrypt data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEloData();
  }, [nickname]);

  return { data, loading, error };
};
