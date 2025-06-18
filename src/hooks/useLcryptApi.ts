
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LcryptEloData {
  elo: number;
  level: string;
  region: string;
  country: string;
  country_flag: string;
  region_ranking: number;
  country_ranking: number;
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
        console.log(`Fetching ELO data for nickname: ${nickname}`);
        
        const { data: result, error: supabaseError } = await supabase.functions.invoke('get-lcrypt-elo', {
          body: { nickname }
        });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        if (result.error) {
          throw new Error('Failed to fetch ELO data');
        }

        console.log('Lcrypt ELO data received:', result);
        setData(result);
      } catch (err) {
        console.error('Error fetching lcrypt data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEloData();
  }, [nickname]);

  return { data, loading, error };
};
