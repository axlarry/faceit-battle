
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

/**
 * Limits concurrent lcrypt requests to 1.
 *
 * When 3+ requests hit lcrypt.eu simultaneously, each Supabase edge function
 * invocation creates its own in-memory queue (not shared). All requests fire
 * to lcrypt.eu at the same time → rate-limit → each times out at 10s.
 *
 * With maxConcurrent=1, each lcrypt call starts only after the previous one
 * finishes. The server-side 2s gap is respected and each completes in ~2s
 * instead of timing out at 10s. 35 players × ~2s = ~70s total lcrypt time,
 * but players appear immediately with FACEIT data after ~500ms.
 */
class LcryptQueue {
  private running = 0;
  private readonly maxConcurrent: number;
  private queue: Array<() => void> = [];

  constructor(maxConcurrent = 1) {
    this.maxConcurrent = maxConcurrent;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      this.queue.shift()?.();
    }
  }
}

const lcryptQueue = new LcryptQueue(1);

export class FriendDataProcessor {
  private coverImageCache = new Map<string, string | null>();
  private persistCacheSupported: Promise<boolean> | null = null;

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
      // ── Phase 1: FACEIT data only (fast, ~300-600ms) ─────────────────────
      const basicData = await performanceMonitor.measureAsyncTime(
        `faceit-api-${friend.nickname}`,
        () => optimizedApiService.faceitApiCall(`/players/${friend.player_id}`)
      ).catch(() => null);

      const currentNickname = basicData?.nickname || friend.nickname;

      // Cover image: prefer fresh API value, then memory cache, then DB value
      const freshCover  = basicData?.cover_image ?? null;
      const cachedCover = this.coverImageCache.get(currentNickname) ?? null;
      const coverImage  = freshCover ?? cachedCover ?? friend.cover_image ?? null;

      if (coverImage !== null) {
        this.coverImageCache.set(currentNickname, coverImage);
        if (currentNickname !== friend.nickname) {
          this.coverImageCache.set(friend.nickname, coverImage);
        }
      }

      const levelFromApi = basicData?.games?.cs2?.skill_level;
      const eloFromApi   = basicData?.games?.cs2?.faceit_elo;

      // Preserve lcrypt data from previous cycle so nothing disappears while
      // the phase-2 background fetch is in progress.
      const prevLcrypt       = (friend as FriendWithLcrypt).lcryptData;
      const prevIsLive       = (friend as FriendWithLcrypt).isLive || false;
      const prevMatchDetails = (friend as FriendWithLcrypt).liveMatchDetails;
      const prevCompetition  = (friend as FriendWithLcrypt).liveCompetition;

      const phase1Friend: FriendWithLcrypt = {
        ...friend,
        nickname:         currentNickname,
        avatar:           basicData?.avatar    || friend.avatar,
        level:            levelFromApi         ?? friend.level ?? 0,
        elo:              eloFromApi           ?? friend.elo   ?? 0,
        cover_image:      coverImage           || undefined,
        lcryptData:       prevLcrypt           ?? null,
        isLive:           prevIsLive,
        liveMatchDetails: prevMatchDetails,
        liveCompetition:  prevCompetition,
      };

      // Show player immediately with FACEIT data, clear loading spinner
      setFriendsWithLcrypt(prev =>
        prev.map(pf => pf.player_id === phase1Friend.player_id ? phase1Friend : pf)
      );
      setLoadingFriends(prev => {
        const s = new Set(prev);
        s.delete(friend.nickname);
        return s;
      });

      // Auto-sync nickname / avatar changes to DB
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

      // ── Phase 2: lcrypt data (slow, ~2s serialized) — background ─────────
      // Uses LcryptQueue(1) so only one lcrypt request is in flight at a time.
      // This prevents concurrent requests from timing out on lcrypt.eu.
      lcryptQueue.run(() =>
        performanceMonitor.measureAsyncTime(
          `lcrypt-api-${friend.nickname}`,
          () => lcryptOptimizedService.getCompletePlayerData(
            friend.nickname,
            friend.player_id
          )
        ).catch(() => null)
      ).then(optimizedData => {
        if (!optimizedData) return;

        const phase2Friend: FriendWithLcrypt = {
          ...phase1Friend,
          lcryptData:       optimizedData?.error ? null : optimizedData,
          elo:              optimizedData?.elo   ?? eloFromApi ?? friend.elo ?? 0,
          isLive:           optimizedData?.isLive || false,
          liveMatchDetails: optimizedData?.liveInfo?.matchDetails,
          liveCompetition:  optimizedData?.liveInfo?.competition,
        };

        const liveMatchInfo: LiveMatchInfo = {
          isLive:       optimizedData?.isLive || false,
          matchId:      optimizedData?.liveInfo?.matchId,
          competition:  optimizedData?.liveInfo?.competition,
          status:       optimizedData?.liveInfo?.status,
          state:        optimizedData?.liveInfo?.state,
          matchDetails: optimizedData?.liveInfo?.matchDetails,
          liveMatch:    optimizedData?.liveInfo?.liveMatch,
        };

        setFriendsWithLcrypt(prev =>
          prev.map(pf => pf.player_id === phase2Friend.player_id ? phase2Friend : pf)
        );
        setLiveMatches(prev => ({ ...prev, [friend.player_id]: liveMatchInfo }));
        this.persistCache(friend.player_id, phase2Friend, optimizedData).catch(() => {});
      }).catch(() => {});
      // ─────────────────────────────────────────────────────────────────────

      return phase1Friend;

    } catch (error) {
      const failed: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt(prev => prev.map(pf => pf.player_id === failed.player_id ? failed : pf));
      setLiveMatches(prev => ({ ...prev, [friend.player_id]: { isLive: false } }));
      setLoadingFriends(prev => { const s = new Set(prev); s.delete(friend.nickname); return s; });
      return failed;
    }
  }

  /** One-time probe: returns true if the edge function supports update_cache. */
  private checkPersistCacheSupport(): Promise<boolean> {
    if (this.persistCacheSupported !== null) return this.persistCacheSupported;

    this.persistCacheSupported = getInvokeFn().then(async (invoke) => {
      try {
        const result = await invoke('friends-gateway', {
          action: 'update_cache',
          player: { player_id: '__probe__' },
        });
        // supabase.functions.invoke puts HTTP errors in result.error (not result.data)
        if (result?.error) return false;
        return true;
      } catch {
        return false;
      }
    });

    return this.persistCacheSupported;
  }

  /** Fire-and-forget: write display-cache fields to the friends DB row. */
  private async persistCache(
    playerId: string,
    friend: FriendWithLcrypt,
    lcrypt: any
  ): Promise<void> {
    const supported = await this.checkPersistCacheSupport();
    if (!supported) return;

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
