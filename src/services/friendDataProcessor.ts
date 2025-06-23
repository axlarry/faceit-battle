
import { Player } from '@/types/Player';
import { lcryptOptimizedService } from '@/services/lcryptOptimizedService';
import { playerService } from '@/services/playerService';
import { FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

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
      
      // UN SINGUR APEL API pentru datele Lcrypt
      const optimizedData = await lcryptOptimizedService.getCompletePlayerData(friend.nickname);
      
      // OPTIMIZED: Cover image doar dacă nu există în cache
      let coverImage = friend.cover_image;
      if (!coverImage && !this.coverImageCache.has(friend.nickname)) {
        console.log(`🖼️ OPTIMIZED: Fetching cover image for ${friend.nickname} (first time only)`);
        coverImage = await playerService.getPlayerCoverImage(friend.nickname);
        this.coverImageCache.set(friend.nickname, coverImage);
      } else if (this.coverImageCache.has(friend.nickname)) {
        coverImage = this.coverImageCache.get(friend.nickname) || friend.cover_image;
        console.log(`📦 OPTIMIZED: Using cached cover image for ${friend.nickname}`);
      }
      
      // Construiește obiectul actualizat cu toate datele
      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        lcryptData: optimizedData?.error ? null : optimizedData,
        elo: optimizedData?.elo || friend.elo || 0,
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
