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

// Cache pentru datele Lcrypt (15 minute pentru a reduce API calls)
const CACHE_DURATION = 15 * 60 * 1000;
const dataCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiting optimizat - 600ms între request-uri
const RATE_LIMIT_DELAY = 600;
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLcryptData = useCallback(async (nickname: string): Promise<any> => {
    // Verifică cache-ul
    const cached = dataCache.get(nickname);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached data for ${nickname}`);
      return cached.data;
    }

    // Rate limiting optimizat
    await rateLimitedDelay();

    try {
      console.log(`Fetching ELO data for: ${nickname}`);
      
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
      setLoadingProgress(0);
      return;
    }

    // Anulează request-urile anterioare
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      console.log('Loading lcrypt data for friends:', friends.map(f => f.nickname));
      
      // Inițializează lista cu prietenii fără date lcrypt
      const initialFriends = friends.map(friend => ({ ...friend, lcryptData: null }));
      setFriendsWithLcrypt(initialFriends);

      // Procesare concurentă pentru viteza optimă - maxim 3 request-uri simultan
      const BATCH_SIZE = 3;
      const updatedFriends = [...initialFriends];
      
      for (let i = 0; i < friends.length; i += BATCH_SIZE) {
        const batch = friends.slice(i, i + BATCH_SIZE);
        
        // Procesează batch-ul concurrent
        const batchPromises = batch.map(async (friend, batchIndex) => {
          try {
            const lcryptData = await fetchLcryptData(friend.nickname);
            const actualIndex = i + batchIndex;
            updatedFriends[actualIndex] = { ...friend, lcryptData };
            return { index: actualIndex, data: lcryptData };
          } catch (error) {
            console.error(`Error loading lcrypt data for ${friend.nickname}:`, error);
            return { index: i + batchIndex, data: null };
          }
        });

        await Promise.all(batchPromises);
        
        // Actualizează progresul și starea
        const completedCount = Math.min(i + BATCH_SIZE, friends.length);
        setLoadingProgress((completedCount / friends.length) * 100);
        setFriendsWithLcrypt([...updatedFriends]);
        
        // Pauză scurtă între batch-uri pentru a nu supraîncărca API-ul
        if (i + BATCH_SIZE < friends.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log('All friends with lcrypt data loaded:', updatedFriends.length);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error loading lcrypt data:', error);
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
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
    loadingProgress,
    error,
    refreshLcryptData,
    clearCache,
    reloadAll: loadAllLcryptData
  };
};
