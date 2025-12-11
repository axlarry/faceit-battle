
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
      // Optimized data fetching
      let currentNickname = friend.nickname;
      let basicData: any = null;
      
      try {
        basicData = await performanceMonitor.measureAsyncTime(
          `faceit-api-${friend.nickname}`,
          () => optimizedApiService.faceitApiCall(`/players/${friend.player_id}`)
        );
        currentNickname = basicData?.nickname || friend.nickname;
      } catch (e) {
        // Silent fail for basic data
      }
      
      // Lcrypt data fetching with LIVE detection
      const optimizedData = await performanceMonitor.measureAsyncTime(
        `lcrypt-api-${currentNickname}`,
        () => lcryptOptimizedService.getCompletePlayerData(currentNickname)
      );
      
      // Cover image with caching
      let coverImage = friend.cover_image;
      if (!coverImage) {
        if (this.coverImageCache.has(currentNickname)) {
          coverImage = this.coverImageCache.get(currentNickname);
        } else {
          coverImage = await playerService.getPlayerCoverImage(currentNickname);
          this.coverImageCache.set(currentNickname, coverImage);
        }
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

      // Auto-sync changes (nickname or avatar) to database
      const nicknameChanged = currentNickname !== friend.nickname;
      const avatarChanged = basicData?.avatar && basicData.avatar !== friend.avatar;
      
      if (nicknameChanged || avatarChanged) {
        try {
          const { invokeEdgeFunction, isDiscordActivity } = await import('@/lib/discordProxy');
          const { supabase } = await import('@/integrations/supabase/client');
          
          const invokeFn = isDiscordActivity() 
            ? (fn: string, body: Record<string, unknown>) => invokeEdgeFunction(fn, body)
            : (fn: string, body: Record<string, unknown>) => supabase.functions.invoke(fn, { body });
          
          await invokeFn('friends-gateway', {
            action: 'sync_nickname',
            playerId: friend.player_id,
            newNickname: currentNickname,
            newAvatar: basicData?.avatar
          }).catch(() => {});
        } catch (error) {
          // Silent fail for sync
        }
      }

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

  clearCoverImageCache() {
    this.coverImageCache.clear();
  }
}

export const friendDataProcessor = new FriendDataProcessor();
