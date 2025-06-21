
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

// Cache optimizat pentru datele Lcrypt (20 minute pentru a reduce stress pe API)
const CACHE_DURATION = 20 * 60 * 1000;
const dataCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiting mai relaxat pentru a reduce stress pe API - 1 secunde între request-uri
const RATE_LIMIT_DELAY = 1000;
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
  const [loadingFriends, setLoadingFriends] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLcryptData = useCallback(async (nickname: string): Promise<any> => {
    // Verifică cache-ul
    const cached = dataCache.get(nickname);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Using cached data for ${nickname}`);
      return cached.data;
    }

    // Rate limiting optimizat
    await rateLimitedDelay();

    try {
      console.log(`🔍 Fetching ELO data for: ${nickname}`);
      
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

      // Salvează în cache cu timestamp
      dataCache.set(nickname, { data: result, timestamp: Date.now() });
      console.log(`💾 Cached data for ${nickname}`);
      
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
      setLoadingFriends(new Set());
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
    setLoadingFriends(new Set());

    try {
      console.log('📊 Loading lcrypt data for friends:', friends.map(f => f.nickname));
      
      // Inițializează lista cu prietenii fără date lcrypt
      const initialFriends = friends.map(friend => ({ ...friend, lcryptData: null }));
      setFriendsWithLcrypt(initialFriends);

      // Procesare secvențială pentru a reduce stress pe API - doar 2 request-uri simultan
      const BATCH_SIZE = 2;
      const updatedFriends = [...initialFriends];
      
      for (let i = 0; i < friends.length; i += BATCH_SIZE) {
        const batch = friends.slice(i, i + BATCH_SIZE);
        
        // Marchează prietenii ca fiind în curs de încărcare
        const currentlyLoading = new Set<string>();
        batch.forEach(friend => currentlyLoading.add(friend.nickname));
        setLoadingFriends(prev => new Set([...prev, ...currentlyLoading]));
        
        // Procesează batch-ul concurrent
        const batchPromises = batch.map(async (friend, batchIndex) => {
          try {
            const lcryptData = await fetchLcryptData(friend.nickname);
            const actualIndex = i + batchIndex;
            updatedFriends[actualIndex] = { ...friend, lcryptData };
            
            // Elimină din loading după completare
            setLoadingFriends(prev => {
              const newSet = new Set(prev);
              newSet.delete(friend.nickname);
              return newSet;
            });
            
            return { index: actualIndex, data: lcryptData };
          } catch (error) {
            console.error(`Error loading lcrypt data for ${friend.nickname}:`, error);
            
            // Elimină din loading chiar și în caz de eroare
            setLoadingFriends(prev => {
              const newSet = new Set(prev);
              newSet.delete(friend.nickname);
              return newSet;
            });
            
            return { index: i + batchIndex, data: null };
          }
        });

        await Promise.all(batchPromises);
        
        // Actualizează progresul și starea
        const completedCount = Math.min(i + BATCH_SIZE, friends.length);
        setLoadingProgress((completedCount / friends.length) * 100);
        setFriendsWithLcrypt([...updatedFriends]);
        
        // Pauză mai lungă între batch-uri pentru a reduce stress pe API
        if (i + BATCH_SIZE < friends.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('✅ All friends with lcrypt data loaded:', updatedFriends.length);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error loading lcrypt data:', error);
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
      setLoadingFriends(new Set());
    }
  }, [friends, enabled, fetchLcryptData]);

  const refreshLcryptData = useCallback(async (nickname: string) => {
    // Marchează prietenul ca fiind în loading
    setLoadingFriends(prev => new Set([...prev, nickname]));
    
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
    
    // Elimină din loading după completare
    setLoadingFriends(prev => {
      const newSet = new Set(prev);
      newSet.delete(nickname);
      return newSet;
    });
  }, [fetchLcryptData]);

  const clearCache = useCallback(() => {
    dataCache.clear();
    console.log('🗑️ Lcrypt cache cleared');
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
    loadingFriends,
    refreshLcryptData,
    clearCache,
    reloadAll: loadAllLcryptData
  };
};
