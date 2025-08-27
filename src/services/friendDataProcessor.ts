
import { Player } from '@/types/Player';
import { lcryptOptimizedService } from '@/services/lcryptOptimizedService';
import { playerService } from '@/services/playerService';
import { FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';
import { optimizedApiService } from '@/services/optimizedApiService';
import { performanceMonitor } from '@/utils/performance';

export class FriendDataProcessor {
  private coverImageCache = new Map<string, string | null>();

  async updateFriendData(
    friend: Player,
    enabled: boolean,
    setLoadingFriends: (updater: (prev: Set<string>) => Set<string>) => void,
    setFriendsWithLcrypt: (updater: (prev: FriendWithLcrypt[]) => FriendWithLcrypt[]) => void,
    setLiveMatches: (updater: (prev: Record<string, LiveMatchInfo>) => Record<string, LiveMatchInfo>) => void
  ): Promise<FriendWithLcrypt> {
    if (!enabled) return friend;

    // Marchează prietenul ca fiind în curs de încărcare
    setLoadingFriends(prev => new Set(prev).add(friend.nickname));

    try {
      console.log(`🚀 OPTIMIZED: Fetching complete data for ${friend.nickname}...`);
      
      // V2.0 Optimized data fetching with performance monitoring
      let currentNickname = friend.nickname;
      let basicData: any = null;
      
      try {
        basicData = await performanceMonitor.measureAsyncTime(
          `faceit-api-${friend.nickname}`,
          () => optimizedApiService.faceitApiCall(`/players/${friend.player_id}`)
        );
        currentNickname = basicData?.nickname || friend.nickname;
      } catch (e) {
        console.warn(`⚠️ Could not refresh basic data for ${friend.nickname} by id ${friend.player_id}`, e);
      }
      
      // V2.0 Optimized Lcrypt data fetching
      const optimizedData = await performanceMonitor.measureAsyncTime(
        `lcrypt-api-${currentNickname}`,
        () => optimizedApiService.lcryptApiCall(currentNickname)
      );
      
      // OPTIMIZED: Cover image doar dacă nu există în cache
      let coverImage = friend.cover_image;
      if (!coverImage && !this.coverImageCache.has(currentNickname)) {
        console.log(`🖼️ OPTIMIZED: Fetching cover image for ${currentNickname} (first time only)`);
        coverImage = await playerService.getPlayerCoverImage(currentNickname);
        this.coverImageCache.set(currentNickname, coverImage);
      } else if (this.coverImageCache.has(currentNickname)) {
        coverImage = this.coverImageCache.get(currentNickname) || friend.cover_image;
        console.log(`📦 OPTIMIZED: Using cached cover image for ${currentNickname}`);
      }
      
      // Construiește obiectul actualizat cu toate datele (identificare prin player_id, nu nickname)
      const levelFromApi = basicData?.games?.cs2?.skill_level;
      const eloFromApi = basicData?.games?.cs2?.faceit_elo;

      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        nickname: currentNickname,
        avatar: basicData?.avatar || friend.avatar,
        level: levelFromApi ?? friend.level ?? 0,
        lcryptData: optimizedData?.error ? null : optimizedData,
        elo: optimizedData?.elo ?? eloFromApi ?? friend.elo ?? 0,
        isLive: optimizedData?.isLive || false,
        liveMatchDetails: optimizedData?.liveInfo?.matchDetails,
        liveCompetition: optimizedData?.liveInfo?.competition,
        cover_image: coverImage || friend.cover_image
      };

      // Actualizează statusul LIVE în state-ul separat
      const liveMatchInfo: LiveMatchInfo = {
        isLive: optimizedData?.isLive || false,
        matchId: optimizedData?.liveInfo?.matchId,
        competition: optimizedData?.liveInfo?.competition,
        status: optimizedData?.liveInfo?.status,
        state: optimizedData?.liveInfo?.state,
        matchDetails: optimizedData?.liveInfo?.matchDetails,
        liveMatch: optimizedData?.liveInfo?.liveMatch
      };

      setLiveMatches(prev => ({
        ...prev,
        [friend.player_id]: liveMatchInfo
      }));

      console.log(`✅ OPTIMIZED: Updated ${friend.nickname} with 1 API call instead of 3`);
      console.log(`📊 OPTIMIZATION: ELO=${updatedFriend.elo}, Live=${updatedFriend.isLive}, Cover=${!!coverImage ? 'cached' : 'none'}`);
      
      // Actualizează prietenul în lista principală
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
      console.error(`❌ Failed to fetch OPTIMIZED data for ${friend.nickname}:`, error);
      
      // Actualizează cu date null în caz de eroare
      const failedFriend: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === failedFriend.player_id ? failedFriend : prevFriend
        )
      );
      
      // Actualizează statusul LIVE ca false în caz de eroare
      setLiveMatches(prev => ({
        ...prev,
        [friend.player_id]: { isLive: false }
      }));
      
      // Elimină prietenul din setul de încărcare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return failedFriend;
    }
  }

  async processFriendsBatch(
    batch: Player[],
    updateFriendData: (friend: Player) => Promise<FriendWithLcrypt>
  ): Promise<FriendWithLcrypt[]> {
    const batchPromises = batch.map(friend => updateFriendData(friend));
    const batchResults = await Promise.allSettled(batchPromises);
    
    return batchResults
      .filter((result): result is PromiseFulfilledResult<FriendWithLcrypt> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  // Metodă pentru curățarea cache-ului dacă este necesar
  clearCoverImageCache() {
    this.coverImageCache.clear();
    console.log('🧹 OPTIMIZED: Cover image cache cleared');
  }
}

export const friendDataProcessor = new FriendDataProcessor();
