
import { Player } from '@/types/Player';
import { lcryptOptimizedService } from '@/services/lcryptOptimizedService';
import { FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';
import { optimizedApiService } from '@/services/optimizedApiService';
import { performanceMonitor } from '@/utils/performance';

// Lazily imported to avoid circular dep issues
let _invokeEdgeFunction: ((fn: string, body: Record<string, unknown>) => Promise<any>) | null = null;
async function getInvokeFn() {
  if (_invokeEdgeFunction) return _invokeEdgeFunction;
  const [{ invokeEdgeFunction, isDiscordActivity }, { supabase }] = await Promise.all([
    import('@/lib/discordProxy'),
    import('@/integrations/supabase/client'),
  ]);
  _invokeEdgeFunction = isDiscordActivity()
    ? (fn, body) => invokeEdgeFunction(fn, body)
    : (fn, body) => supabase.functions.invoke(fn, { body });
  return _invokeEdgeFunction;
}

export class FriendDataProcessor {
  // In-memory cover cache: keyed by nickname, value is URL or null
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
      // ── Parallel fetch: FACEIT basic data + lcrypt ELO/live ──────────────
      // Cover image is included in the FACEIT /players/{id} response
      // (cover_image field), so we no longer need a separate API call for it.
      const [basicData, optimizedData] = await Promise.all([
        performanceMonitor.measureAsyncTime(
          `faceit-api-${friend.nickname}`,
          () => optimizedApiService.faceitApiCall(`/players/${friend.player_id}`)
        ).catch(() => null),

        performanceMonitor.measureAsyncTime(
          `lcrypt-api-${friend.nickname}`,
          () => lcryptOptimizedService.getCompletePlayerData(
            friend.nickname,
            friend.player_id
          )
        ).catch(() => null),
      ]);
      // ─────────────────────────────────────────────────────────────────────

      const currentNickname = basicData?.nickname || friend.nickname;

      // Cover image: prefer fresh value from FACEIT, then memory cache, then
      // whatever was already stored on the friend object (came from DB).
      const freshCover = basicData?.cover_image ?? null;
      const cachedCover = this.coverImageCache.get(currentNickname) ?? null;
      const coverImage  = freshCover ?? cachedCover ?? friend.cover_image ?? null;

      // Keep memory cache up to date for this session
      if (coverImage !== null) {
        this.coverImageCache.set(currentNickname, coverImage);
        if (currentNickname !== friend.nickname) {
          this.coverImageCache.set(friend.nickname, coverImage);
        }
      }

      const levelFromApi = basicData?.games?.cs2?.skill_level;
      const eloFromApi   = basicData?.games?.cs2?.faceit_elo;

      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        nickname:         currentNickname,
        avatar:           basicData?.avatar   || friend.avatar,
        level:            levelFromApi        ?? friend.level ?? 0,
        lcryptData:       optimizedData?.error ? null : optimizedData,
        elo:              optimizedData?.elo   ?? eloFromApi ?? friend.elo ?? 0,
        isLive:           optimizedData?.isLive || false,
        liveMatchDetails: optimizedData?.liveInfo?.matchDetails,
        liveCompetition:  optimizedData?.liveInfo?.competition,
        cover_image:      coverImage || undefined,
      };

      // Auto-sync nickname / avatar changes to DB (password-gated)
      const nicknameChanged = currentNickname !== friend.nickname;
      const avatarChanged   = basicData?.avatar && basicData.avatar !== friend.avatar;
      if (nicknameChanged || avatarChanged) {
        const pwd = localStorage.getItem('faceit_friends_password') || '';
        if (pwd) {
          getInvokeFn().then(invoke =>
            invoke('friends-gateway', {
              action: 'sync_nickname', password: pwd,
              playerId: friend.player_id, newNickname: currentNickname,
              newAvatar: basicData?.avatar,
            })
          ).catch(() => {});
        }
      }

      // ── Background: persist display cache to DB ───────────────────────────
      // This fires asynchronously after each player update so the next page
      // load can render cover images, country flags, ELO etc. immediately.
      this.persistCache(friend.player_id, updatedFriend, optimizedData).catch(() => {});
      // ─────────────────────────────────────────────────────────────────────

      const liveMatchInfo: LiveMatchInfo = {
        isLive:       optimizedData?.isLive || false,
        matchId:      optimizedData?.liveInfo?.matchId,
        competition:  optimizedData?.liveInfo?.competition,
        status:       optimizedData?.liveInfo?.status,
        state:        optimizedData?.liveInfo?.state,
        matchDetails: optimizedData?.liveInfo?.matchDetails,
        liveMatch:    optimizedData?.liveInfo?.liveMatch,
      };

      setLiveMatches(prev => ({ ...prev, [friend.player_id]: liveMatchInfo }));
      setFriendsWithLcrypt(prev =>
        prev.map(pf => pf.player_id === updatedFriend.player_id ? updatedFriend : pf)
      );
      setLoadingFriends(prev => { const s = new Set(prev); s.delete(friend.nickname); return s; });

      return updatedFriend;

    } catch (error) {
      const failed: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt(prev => prev.map(pf => pf.player_id === failed.player_id ? failed : pf));
      setLiveMatches(prev => ({ ...prev, [friend.player_id]: { isLive: false } }));
      setLoadingFriends(prev => { const s = new Set(prev); s.delete(friend.nickname); return s; });
      return failed;
    }
  }

  /** Fire-and-forget: write all display-cache fields to the friends DB row. */
  private async persistCache(
    playerId: string,
    friend: FriendWithLcrypt,
    lcrypt: any
  ): Promise<void> {
    const invoke = await getInvokeFn();
    await invoke('friends-gateway', {
      action: 'update_cache',
      player: {
        player_id:       playerId,
        nickname:        friend.nickname,
        avatar:          friend.avatar,
        level:           friend.level    ?? 0,
        elo:             friend.elo      ?? 0,
        cover_image:     friend.cover_image   ?? null,
        country:         lcrypt?.country       ?? null,
        country_flag:    lcrypt?.country_flag  ?? null,
        region:          lcrypt?.region        ?? null,
        region_ranking:  lcrypt?.region_ranking  ?? null,
        country_ranking: lcrypt?.country_ranking ?? null,
      },
    });
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
