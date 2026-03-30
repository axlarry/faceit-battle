
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

    setLoadingFriends(prev => new Set(prev).add(friend.nickname));

    try {
      // Cover image: return cached value synchronously if available, avoiding
      // a network round-trip that would otherwise serialize with other fetches.
      const fetchCover = (): Promise<string | null | undefined> => {
        if (friend.cover_image) return Promise.resolve(friend.cover_image);
        if (this.coverImageCache.has(friend.nickname)) {
          return Promise.resolve(this.coverImageCache.get(friend.nickname));
        }
        return playerService.getPlayerCoverImage(friend.nickname)
          .then(img => { this.coverImageCache.set(friend.nickname, img ?? null); return img; })
          .catch(() => null);
      };

      // ── All three fetches run in parallel ──────────────────────────────────
      // FACEIT basic data, lcrypt ELO/live, and cover image have no strict
      // ordering dependency between them, so launching them concurrently cuts
      // per-player latency from (A + B + C) down to max(A, B, C).
      const [basicData, optimizedData, coverImage] = await Promise.all([
        performanceMonitor.measureAsyncTime(
          `faceit-api-${friend.nickname}`,
          () => optimizedApiService.faceitApiCall(`/players/${friend.player_id}`)
        ).catch(() => null),

        performanceMonitor.measureAsyncTime(
          `lcrypt-api-${friend.nickname}`,
          () => lcryptOptimizedService.getCompletePlayerData(
            friend.nickname,
            friend.player_id
            // country omitted — lcrypt's primary response already includes it;
            // the fallback path (FACEIT history) is country-agnostic anyway.
          )
        ).catch(() => null),

        fetchCover()
      ]);
      // ─────────────────────────────────────────────────────────────────────

      const currentNickname = basicData?.nickname || friend.nickname;

      // Propagate new nickname into cover cache
      if (currentNickname !== friend.nickname && coverImage !== undefined) {
        this.coverImageCache.set(currentNickname, coverImage ?? null);
      }

      const levelFromApi = basicData?.games?.cs2?.skill_level;
      const eloFromApi   = basicData?.games?.cs2?.faceit_elo;

      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        nickname:        currentNickname,
        avatar:          basicData?.avatar || friend.avatar,
        level:           levelFromApi ?? friend.level ?? 0,
        lcryptData:      optimizedData?.error ? null : optimizedData,
        elo:             optimizedData?.elo ?? eloFromApi ?? friend.elo ?? 0,
        isLive:          optimizedData?.isLive || false,
        liveMatchDetails: optimizedData?.liveInfo?.matchDetails,
        liveCompetition:  optimizedData?.liveInfo?.competition,
        cover_image:     coverImage || friend.cover_image
      };

      // Auto-sync nickname / avatar changes to the database
      const nicknameChanged = currentNickname !== friend.nickname;
      const avatarChanged   = basicData?.avatar && basicData.avatar !== friend.avatar;

      if (nicknameChanged || avatarChanged) {
        const storedPassword = localStorage.getItem('faceit_friends_password') || '';
        if (storedPassword) {
          import('@/lib/discordProxy').then(({ invokeEdgeFunction, isDiscordActivity }) => {
            import('@/integrations/supabase/client').then(({ supabase }) => {
              const invokeFn = isDiscordActivity()
                ? (fn: string, body: Record<string, unknown>) => invokeEdgeFunction(fn, body)
                : (fn: string, body: Record<string, unknown>) => supabase.functions.invoke(fn, { body });

              invokeFn('friends-gateway', {
                action:      'sync_nickname',
                password:    storedPassword,
                playerId:    friend.player_id,
                newNickname: currentNickname,
                newAvatar:   basicData?.avatar
              }).catch(() => {});
            });
          }).catch(() => {});
        }
      }

      const liveMatchInfo: LiveMatchInfo = {
        isLive:       optimizedData?.isLive || false,
        matchId:      optimizedData?.liveInfo?.matchId,
        competition:  optimizedData?.liveInfo?.competition,
        status:       optimizedData?.liveInfo?.status,
        state:        optimizedData?.liveInfo?.state,
        matchDetails: optimizedData?.liveInfo?.matchDetails,
        liveMatch:    optimizedData?.liveInfo?.liveMatch
      };

      setLiveMatches(prev => ({ ...prev, [friend.player_id]: liveMatchInfo }));

      setFriendsWithLcrypt(prev =>
        prev.map(pf => pf.player_id === updatedFriend.player_id ? updatedFriend : pf)
      );

      setLoadingFriends(prev => {
        const s = new Set(prev);
        s.delete(friend.nickname);
        return s;
      });

      return updatedFriend;

    } catch (error) {
      const failed: FriendWithLcrypt = { ...friend, lcryptData: null };

      setFriendsWithLcrypt(prev =>
        prev.map(pf => pf.player_id === failed.player_id ? failed : pf)
      );
      setLiveMatches(prev => ({ ...prev, [friend.player_id]: { isLive: false } }));

      setLoadingFriends(prev => {
        const s = new Set(prev);
        s.delete(friend.nickname);
        return s;
      });

      return failed;
    }
  }

  async processFriendsBatch(
    batch: Player[],
    updateFriendData: (friend: Player) => Promise<FriendWithLcrypt>
  ): Promise<FriendWithLcrypt[]> {
    const results = await Promise.allSettled(batch.map(f => updateFriendData(f)));
    return results
      .filter((r): r is PromiseFulfilledResult<FriendWithLcrypt> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);
  }

  clearCoverImageCache() {
    this.coverImageCache.clear();
  }
}

export const friendDataProcessor = new FriendDataProcessor();
