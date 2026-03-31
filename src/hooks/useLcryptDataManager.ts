
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Player } from '@/types/Player';
import { friendDataProcessor } from '@/services/friendDataProcessor';
import { useLcryptLoadingState } from '@/hooks/helpers/useLcryptLoadingState';
import { useIndividualUpdates } from '@/hooks/helpers/useIndividualUpdates';
import { UseLcryptDataManagerProps, FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

// How long to wait after the initial batch load before starting the update cycle
const INDIVIDUAL_START_DELAY_MS = 10000;
// Minimum interval allowed between full batch reloads
const MIN_FULL_RELOAD_INTERVAL_MS = 90000;

export const useLcryptDataManager = ({ friends, enabled = true }: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchInfo>>({});
  const [isManualUpdate, setIsManualUpdate] = useState(false);

  const {
    isLoading,
    loadingProgress,
    loadingFriends,
    setLoadingFriends,
    startLoading,
    finishLoading,
    updateProgress,
    canUpdate
  } = useLcryptLoadingState();

  const updateFriendLcryptData = useCallback(async (friend: Player, showLoadingOverlay = false) => {
    return friendDataProcessor.updateFriendData(
      friend,
      enabled,
      showLoadingOverlay ? setLoadingFriends : () => {},
      setFriendsWithLcrypt,
      setLiveMatches
    );
  }, [enabled, setLoadingFriends]);

  const updateSingleFriend = useCallback(async (friend: Player) => {
    if (!enabled) return;
    try {
      await updateFriendLcryptData(friend, false);
    } catch (error) {
      console.error(`Individual update failed for ${friend.nickname}:`, error);
    }
  }, [enabled, updateFriendLcryptData]);

  const {
    isIndividualUpdating,
    startIndividualUpdates,
    stopIndividualUpdates
  } = useIndividualUpdates({
    friends,
    enabled,
    updateSingleFriend
  });

  const loadLcryptDataForAllFriends = useCallback(async (isManual = false) => {
    if (!enabled || friends.length === 0) {
      setFriendsWithLcrypt(friends.map(f => ({ ...f, lcryptData: null })));
      return;
    }

    if (!isManual && !canUpdate(MIN_FULL_RELOAD_INTERVAL_MS)) {
      return;
    }

    setIsManualUpdate(isManual);
    stopIndividualUpdates();
    startLoading();

    const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
    setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));

    const batchSize = 3;

    for (let i = 0; i < sortedFriends.length; i += batchSize) {
      const batch = sortedFriends.slice(i, i + batchSize);

      try {
        await friendDataProcessor.processFriendsBatch(
          batch,
          (friend) => updateFriendLcryptData(friend, true)
        );
        updateProgress(i + batch.length, sortedFriends.length, i, batchSize);
      } catch (error) {
        console.error('Error processing batch:', error);
      }

      if (i + batchSize < sortedFriends.length) {
        // Minimal delay — lcrypt is now decoupled (runs in background via LcryptQueue)
        // so we no longer need to wait for the queue to drain between batches.
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    finishLoading();
    setIsManualUpdate(false);

    setFriendsWithLcrypt(prev =>
      [...prev].sort((a, b) => {
        const eDiff = (b.elo ?? 0) - (a.elo ?? 0);
        if (eDiff !== 0) return eDiff;
        const wDiff = (b.wins ?? 0) - (a.wins ?? 0);
        if (wDiff !== 0) return wDiff;
        return (a.nickname ?? '').localeCompare(b.nickname ?? '');
      })
    );

    setTimeout(() => startIndividualUpdates(), INDIVIDUAL_START_DELAY_MS);

  }, [friends, enabled, updateFriendLcryptData, canUpdate, startLoading, finishLoading, updateProgress, stopIndividualUpdates, startIndividualUpdates]);

  // Stable string key — changes only when the actual friend list (IDs) changes.
  // Prevents spurious re-runs caused by parent re-creating the friends array object.
  const friendsKey = useMemo(
    () => friends.map(f => f.player_id).join(','),
    [friends]
  );

  // Keep latest callbacks in refs so the effect doesn't need them as deps.
  const loadRef = useRef(loadLcryptDataForAllFriends);
  loadRef.current = loadLcryptDataForAllFriends;
  const stopRef = useRef(stopIndividualUpdates);
  stopRef.current = stopIndividualUpdates;

  useEffect(() => {
    if (!enabled || !friendsKey) return;
    loadRef.current(false);
    return () => stopRef.current();
  // Re-run only when the actual set of friend IDs changes or enabled toggles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendsKey, enabled]);

  return {
    friendsWithLcrypt,
    isLoading: isLoading || (isManualUpdate && isIndividualUpdating),
    loadingProgress,
    loadingFriends,
    liveMatches,
    reloadLcryptData: () => loadLcryptDataForAllFriends(true),
    isIndividualUpdating
  };
};
