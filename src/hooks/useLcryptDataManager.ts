
import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/Player';
import { fetchLcryptData } from '@/services/lcryptLiveService';
import { lcryptLiveService } from '@/services/lcryptLiveService';

interface UseLcryptDataManagerProps {
  friends: Player[];
  enabled?: boolean;
}

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
  isLive?: boolean;
  liveMatchDetails?: any;
  liveCompetition?: string;
}

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  status?: string;
  state?: string;
  matchDetails?: {
    map?: any;
    server?: any;
    score?: any;
    duration?: any;
    round?: any;
    elo_change?: any;
    result?: any;
    chance?: any;
  };
  liveMatch?: any;
}

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFriends, setLoadingFriends] = useState<Set<string>>(new Set());
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const updateFriendLcryptData = useCallback(async (friend: Player) => {
    if (!enabled) return friend;

    // Marchează prietenul ca fiind în curs de încărcare
    setLoadingFriends(prev => new Set(prev).add(friend.nickname));

    try {
      console.log(`Fetching Lcrypt data and live status for ${friend.nickname}...`);
      
      // Încarcă datele Lcrypt și verifică statusul LIVE în paralel
      const [lcryptData, liveInfo] = await Promise.all([
        fetchLcryptData(friend.nickname),
        lcryptLiveService.checkPlayerLiveFromLcrypt(friend.nickname)
      ]);
      
      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        lcryptData,
        elo: lcryptData?.elo || friend.elo || 0,
        isLive: liveInfo.isLive,
        liveMatchDetails: liveInfo.isLive && 'matchDetails' in liveInfo ? liveInfo.matchDetails : undefined,
        liveCompetition: liveInfo.isLive && 'competition' in liveInfo ? liveInfo.competition : undefined
      };

      // Actualizează și statusul LIVE în state-ul separat
      setLiveMatches(prev => ({
        ...prev,
        [friend.player_id]: liveInfo
      }));

      console.log(`✅ Successfully updated ${friend.nickname} with ELO: ${updatedFriend.elo} ${liveInfo.isLive ? '(LIVE)' : ''}`);
      
      // Actualizează prietenul în lista principală imediat după finalizare
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === updatedFriend.player_id ? updatedFriend : prevFriend
        )
      );
      
      // Elimină prietenul din setul de încărcare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return updatedFriend;
    } catch (error) {
      console.error(`❌ Failed to fetch Lcrypt data for ${friend.nickname}:`, error);
      
      // Actualizează cu date null în caz de eroare
      const failedFriend: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === failedFriend.player_id ? failedFriend : prevFriend
        )
      );
      
      // Actualizează și statusul LIVE ca false în caz de eroare
      setLiveMatches(prev => ({
        ...prev,
        [friend.player_id]: { isLive: false }
      }));
      
      // Elimină prietenul din setul de încărcare chiar și în caz de eroare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return failedFriend;
    }
  }, [enabled]);

  const loadLcryptDataForAllFriends = useCallback(async () => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
      return;
    }

    // Verifică dacă au trecut cel puțin 3 minute de la ultimul update pentru a reduce stresul pe API
    const now = Date.now();
    if (lastUpdateTime > 0 && (now - lastUpdateTime) < 180000) { // 3 minute = 180000ms
      console.log(`⏱️ Skipping Lcrypt update, only ${Math.round((now - lastUpdateTime) / 1000)}s since last update. Waiting for 3 minutes between updates.`);
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setLastUpdateTime(now);
    console.log(`🔄 Starting to load Lcrypt data and live status for ${friends.length} friends...`);
    
    // Inițializează lista cu toți prietenii cu lcryptData undefined pentru a declașa loading-ul individual
    setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: undefined })));
    
    // Procesare individuală pentru fiecare prieten cu delay mai mare între requesturi
    const batchSize = 2; // Redus pentru a nu supraîncărca serverul
    const updatedFriends: FriendWithLcrypt[] = [];
    
    for (let i = 0; i < friends.length; i += batchSize) {
      const batch = friends.slice(i, i + batchSize);
      
      try {
        // Procesează batch-ul în paralel
        const batchPromises = batch.map(friend => updateFriendLcryptData(friend));
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Extrage rezultatele valide
        const validResults = batchResults
          .filter((result): result is PromiseFulfilledResult<FriendWithLcrypt> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);
        
        updatedFriends.push(...validResults);
        
        // Actualizează progresul
        const progress = Math.min(100, ((i + batch.length) / friends.length) * 100);
        setLoadingProgress(progress);
        
        console.log(`📊 Progress: ${Math.round(progress)}% (${i + batch.length}/${friends.length})`);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continuă cu următorul batch chiar dacă unul eșuează
      }
      
      // Pauză mai mare între batch-uri pentru a nu supraîncărca serverul Lcrypt
      if (i + batchSize < friends.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Mărit la 500ms
      }
    }

    setIsLoading(false);
    setLoadingProgress(100);
    console.log(`✅ Completed loading Lcrypt data and live status for all friends`);
  }, [friends, enabled, updateFriendLcryptData, lastUpdateTime]);

  // Auto-refresh la intervale mai mari pentru a nu stresa API-ul
  useEffect(() => {
    if (!enabled || friends.length === 0) return;

    // Primul load imediat
    loadLcryptDataForAllFriends();

    // Auto-refresh la fiecare 10 minute (în loc de 5) pentru a reduce stresul pe API
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing Lcrypt data (every 10 minutes)...');
      loadLcryptDataForAllFriends();
    }, 600000); // 10 minute = 600000ms

    return () => clearInterval(interval);
  }, [friends, enabled]);

  return {
    friendsWithLcrypt,
    isLoading,
    loadingProgress,
    loadingFriends,
    liveMatches,
    reloadLcryptData: loadLcryptDataForAllFriends
  };
};
