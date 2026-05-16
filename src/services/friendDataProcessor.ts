import { Player } from "@/types/Player";
import { enrichedPlayerService } from "@/services/enrichedPlayerService";
import {
  FriendWithLcrypt,
  LiveMatchInfo,
} from "@/hooks/types/lcryptDataManagerTypes";
import { optimizedApiService } from "@/services/optimizedApiService";
import { performanceMonitor } from "@/utils/performance";
import { debugLog, debugError } from "@/utils/debug";

// Lazily imported to avoid circular dep issues
let _invokeEdgeFunction:
  | ((fn: string, body: Record<string, unknown>) => Promise<any>)
  | null = null;
async function getInvokeFn() {
  if (_invokeEdgeFunction) return _invokeEdgeFunction;
  const [{ invokeEdgeFunction, isDiscordActivity }, { supabase }] =
    await Promise.all([
      import("@/lib/discordProxy"),
      import("@/integrations/supabase/client"),
    ]);
  _invokeEdgeFunction = isDiscordActivity()
    ? (fn, body) => invokeEdgeFunction(fn, body)
    : (fn, body) => supabase.functions.invoke(fn, { body });
  return _invokeEdgeFunction;
}

export class FriendDataProcessor {
  private coverImageCache = new Map<string, string | null>();
  private persistCacheSupported: Promise<boolean> | null = null;

  async updateFriendData(
    friend: Player,
    enabled: boolean,
    setLoadingFriends: (updater: (prev: Set<string>) => Set<string>) => void,
    setFriendsWithLcrypt: (
      updater: (prev: FriendWithLcrypt[]) => FriendWithLcrypt[],
    ) => void,
    setLiveMatches: (
      updater: (
        prev: Record<string, LiveMatchInfo>,
      ) => Record<string, LiveMatchInfo>,
    ) => void,
  ): Promise<FriendWithLcrypt> {
    if (!enabled) return friend;

    setLoadingFriends((prev) => new Set(prev).add(friend.nickname));

    try {
      // ── Phase 1: FACEIT data only (fast, ~300-600ms) ─────────────────────
      const basicData = await performanceMonitor
        .measureAsyncTime(`faceit-api-${friend.nickname}`, () =>
          optimizedApiService.faceitApiCall(`/players/${friend.player_id}`),
        )
        .catch(() => null);

      const currentNickname = basicData?.nickname || friend.nickname;

      // Cover image: prefer fresh API value, then memory cache, then DB value
      const freshCover = basicData?.cover_image ?? null;
      const cachedCover = this.coverImageCache.get(currentNickname) ?? null;
      const coverImage =
        freshCover ?? cachedCover ?? friend.cover_image ?? null;

      if (coverImage !== null) {
        this.coverImageCache.set(currentNickname, coverImage);
        if (currentNickname !== friend.nickname) {
          this.coverImageCache.set(friend.nickname, coverImage);
        }
      }

      const levelFromApi = basicData?.games?.cs2?.skill_level;
      const eloFromApi = basicData?.games?.cs2?.faceit_elo;

      // Preserve lcrypt data from previous cycle so nothing disappears while
      // the phase-2 background fetch is in progress.
      const prevLcrypt = (friend as FriendWithLcrypt).lcryptData;
      const prevIsLive = (friend as FriendWithLcrypt).isLive || false;
      const prevMatchDetails = (friend as FriendWithLcrypt).liveMatchDetails;
      const prevCompetition = (friend as FriendWithLcrypt).liveCompetition;

      const phase1Friend: FriendWithLcrypt = {
        ...friend,
        nickname: currentNickname,
        avatar: basicData?.avatar || friend.avatar,
        level: levelFromApi ?? friend.level ?? 0,
        elo: eloFromApi ?? friend.elo ?? 0,
        cover_image: coverImage || undefined,
        lcryptData: prevLcrypt ?? null,
        isLive: prevIsLive,
        liveMatchDetails: prevMatchDetails,
        liveCompetition: prevCompetition,
      };

      // Show player immediately with FACEIT data, clear loading spinner
      setFriendsWithLcrypt((prev) =>
        prev.map((pf) =>
          pf.player_id === phase1Friend.player_id ? phase1Friend : pf,
        ),
      );
      setLoadingFriends((prev) => {
        const s = new Set(prev);
        s.delete(friend.nickname);
        return s;
      });

      // Auto-sync nickname / avatar changes to DB
      const nicknameChanged = currentNickname !== friend.nickname;
      const avatarChanged =
        basicData?.avatar && basicData.avatar !== friend.avatar;
      if (nicknameChanged || avatarChanged) {
        const pwd = localStorage.getItem("faceit_friends_password") || "";
        if (pwd) {
          getInvokeFn()
            .then((invoke) =>
              invoke("friends-gateway", {
                action: "sync_nickname",
                password: pwd,
                playerId: friend.player_id,
                newNickname: currentNickname,
                newAvatar: basicData?.avatar,
              }),
            )
            .catch(() => {});
        }
      }

      // ── Phase 2: enriched data (FaceitAnalyser + FACEIT history fallback) ──
      // FaceitAnalyserQueue (inside enrichedPlayerService) handles serialization,
      // 5s interval, caching (10min success / 15min error), and retry with backoff.
      performanceMonitor
        .measureAsyncTime(`enriched-api-${friend.nickname}`, () =>
          enrichedPlayerService.getEnrichedPlayerData(
            friend.nickname,
            friend.player_id,
            friend.country,
          ),
        )
        .catch(() => null)
        .then((optimizedData) => {
          debugLog(
            `Phase2 result:`,
            JSON.stringify(optimizedData).slice(0, 300),
          );
          if (!optimizedData) {
            debugLog(`Phase2: null, skipping update`);
            return;
          }

          const phase2Friend: FriendWithLcrypt = {
            ...phase1Friend,
            lcryptData: optimizedData?.error ? null : optimizedData,
            elo: optimizedData?.elo ?? eloFromApi ?? friend.elo ?? 0,
            isLive: optimizedData?.isLive || false,
            liveMatchDetails: optimizedData?.liveInfo?.matchDetails,
            liveCompetition: optimizedData?.liveInfo?.competition,
          };

          debugLog(`Phase2 friend: lcryptData.today=`, optimizedData.today);

          const liveMatchInfo: LiveMatchInfo = {
            isLive: optimizedData?.isLive || false,
            matchId: optimizedData?.liveInfo?.matchId,
            competition: optimizedData?.liveInfo?.competition,
            status: optimizedData?.liveInfo?.status,
            state: optimizedData?.liveInfo?.state,
            matchDetails: optimizedData?.liveInfo?.matchDetails,
            liveMatch: optimizedData?.liveInfo?.liveMatch,
          };

          setFriendsWithLcrypt((prev) =>
            prev.map((pf) =>
              pf.player_id === phase2Friend.player_id ? phase2Friend : pf,
            ),
          );
          setLiveMatches((prev) => ({
            ...prev,
            [friend.player_id]: liveMatchInfo,
          }));
          this.persistCache(
            friend.player_id,
            phase2Friend,
            optimizedData,
          ).catch(() => {});
        })
        .catch((err) => {
          debugError(`Phase2 CATCH:`, err);
        });
      // ─────────────────────────────────────────────────────────────────────

      return phase1Friend;
    } catch (error) {
      const failed: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt((prev) =>
        prev.map((pf) => (pf.player_id === failed.player_id ? failed : pf)),
      );
      setLiveMatches((prev) => ({
        ...prev,
        [friend.player_id]: { isLive: false },
      }));
      setLoadingFriends((prev) => {
        const s = new Set(prev);
        s.delete(friend.nickname);
        return s;
      });
      return failed;
    }
  }

  /** One-time probe: returns true if the edge function supports update_cache. */
  private checkPersistCacheSupport(): Promise<boolean> {
    if (this.persistCacheSupported !== null) return this.persistCacheSupported;

    this.persistCacheSupported = getInvokeFn().then(async (invoke) => {
      try {
        const result = await invoke("friends-gateway", {
          action: "update_cache",
          player: { player_id: "__probe__" },
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
    enriched: any,
  ): Promise<void> {
    const supported = await this.checkPersistCacheSupport();
    if (!supported) return;

    const invoke = await getInvokeFn();
    const payload = {
      action: "update_cache",
      player: {
        player_id: playerId,
        nickname: friend.nickname,
        avatar: friend.avatar,
        level: typeof friend.level === "number" ? Math.round(friend.level) : 0,
        elo: typeof friend.elo === "number" ? Math.round(friend.elo) : 0,
        cover_image: friend.cover_image ?? null,
        country: enriched?.country ?? null,
        country_flag: enriched?.country_flag ?? null,
        region: enriched?.region ?? null,
        region_ranking:
          enriched?.region_ranking != null
            ? Number(enriched.region_ranking)
            : null,
        country_ranking:
          enriched?.country_ranking != null
            ? Number(enriched.country_ranking)
            : null,
      },
    };
    const result = await invoke("friends-gateway", payload);
    if (result?.error) {
      console.warn(
        "[persistCache] 500 error for",
        friend.nickname,
        "— msg:",
        result.error?.message ?? result.error,
        "— data:",
        result.data,
      );
    }
  }

  async processFriendsBatch(
    batch: Player[],
    updateFriendData: (friend: Player) => Promise<FriendWithLcrypt>,
  ): Promise<FriendWithLcrypt[]> {
    const results = await Promise.allSettled(
      batch.map((f) => updateFriendData(f)),
    );
    return results
      .filter(
        (r): r is PromiseFulfilledResult<FriendWithLcrypt> =>
          r.status === "fulfilled" && r.value !== null,
      )
      .map((r) => r.value);
  }

  clearCoverImageCache() {
    this.coverImageCache.clear();
  }
}

export const friendDataProcessor = new FriendDataProcessor();
