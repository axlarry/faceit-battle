
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

  const isDiscordEnvironment = (): boolean => {
    return window.parent !== window ||
      window.location.href.includes('discord.com') ||
      document.referrer.includes('discord.com') ||
      window.location.search.includes('frame_id') ||
      navigator.userAgent.includes('Discord');
  };

  const getMockLcryptData = (nickname: string): LcryptEloData => {
    return {
      elo: 4738,
      level: "10",
      region: "EU",
      country: "ro",
      country_flag: "🇷🇴",
      region_ranking: 178,
      country_ranking: 5,
      report: "WIN 16:14 Mirage (+28), LOSE 13:16 Dust II (-25), WIN 16:11 Inferno (+30)",
      today: {
        present: true,
        win: 2,
        lose: 1,
        elo: 33,
        elo_win: 58,
        elo_lose: -25,
        count: 3
      },
      detail: {
        ladder: {
          position: 178,
          region: "EU",
          division: "Skill Level 10",
          points: 582,
          won: 75,
          played: 128,
          win_rate: 0.59
        }
      },
      error: false
    };
  };

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
        
        // Dacă suntem în Discord și API-ul este blocat de CSP, folosim mock data
        if (isDiscordEnvironment() && (
          err.message?.includes('CSP') || 
          err.message?.includes('blocked') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('Failed to fetch')
        )) {
          console.log('🎭 Using mock Lcrypt data due to Discord CSP restrictions');
          setData(getMockLcryptData(nickname));
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEloData();
  }, [nickname]);

  return { data, loading, error };
};
