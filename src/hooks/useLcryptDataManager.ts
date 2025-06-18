
import { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';
import { supabase } from '@/integrations/supabase/client';

interface LcryptPlayerData extends Player {
  lcryptData?: any;
}

interface UseLcryptDataManagerProps {
  friends: Player[];
  enabled?: boolean;
}

// Cache pentru datele Lcrypt (5 minute)
const CACHE_DURATION = 5 * 60 * 1000;
const dataCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiting - maxim 2 request-uri per secundă
const RATE_LIMIT_DELAY = 500;
let lastRequestTime = 0;

const rateLimitedDelay = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
};

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<LcryptPlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLcryptData = useCallback(async (nickname: string): Promise<any> => {
    // Verifică cache-ul
    const cached = dataCache.get(nickname);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached data for ${nickname}`);
      return cached.data;
    }

    // Rate limiting
    await rateLimitedDelay();

    try {
      console.log(`Fetching fresh ELO data for: ${nickname}`);
      
      const { data: result, error: supabaseError } = await supabase.functions.invoke('get-lcrypt-elo', {
        body: { nickname }
      });

      if (supabaseError) {
        console.error('Supabase error for', nickname, ':', supabaseError);
        return null;
      }

      if (result?.error) {
        console.error('Lcrypt API error for', nickname, ':', result.error);
        return null;
      }

      // Salvează în cache
      dataCache.set(nickname, { data: result, timestamp: Date.now() });
      console.log('Cached data for', nickname);
      
      return result;
    } catch (error) {
      console.error('Error fetching lcrypt data for', nickname, ':', error);
      return null;
    }
  }, []);

  const loadAllLcryptData = useCallback(async () => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt([]);
      return;
    }

    // Anulează request-urile anterioare
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading lcrypt data for friends:', friends.map(f => f.nickname));
      
      // Procesează prietenii în batches pentru a evita rate limiting-ul
      const BATCH_SIZE = 3;
      const batches = [];
      
      for (let i = 0; i < friends.length; i += BATCH_SIZE) {
        batches.push(friends.slice(i, i + BATCH_SIZE));
      }

      const updatedFriends: LcryptPlayerData[] = [];

      for (const batch of batches) {
        const batchPromises = batch.map(async (friend) => {
          const lcryptData = await fetchLcryptData(friend.nickname);
          return { ...friend, lcryptData };
        });

        const batchResults = await Promise.all(batchPromises);
        updatedFriends.push(...batchResults);

        // Pauză între batch-uri pentru rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('All friends with lcrypt data loaded:', updatedFriends.length);
      setFriendsWithLcrypt(updatedFriends);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error loading lcrypt data:', error);
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [friends, enabled, fetchLcryptData]);

  const refreshLcryptData = useCallback(async (nickname: string) => {
    // Forțează refresh pentru un singur prieten
    dataCache.delete(nickname);
    const lcryptData = await fetchLcryptData(nickname);
    
    setFriendsWithLcrypt(prev => 
      prev.map(friend => 
        friend.nickname === nickname 
          ? { ...friend, lcryptData }
          : friend
      )
    );
  }, [fetchLcryptData]);

  const clearCache = useCallback(() => {
    dataCache.clear();
    console.log('Lcrypt cache cleared');
  }, []);

  useEffect(() => {
    loadAllLcryptData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAllLcryptData]);

  return {
    friendsWithLcrypt,
    isLoading,
    error,
    refreshLcryptData,
    clearCache,
    reloadAll: loadAllLcryptData
  };
};
