
import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/types/Player';
import { friendDataProcessor } from '@/services/friendDataProcessor';
import { useLcryptLoadingState } from '@/hooks/helpers/useLcryptLoadingState';
import { useIndividualUpdates } from '@/hooks/helpers/useIndividualUpdates';
import { UseLcryptDataManagerProps, FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

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
    
    console.log(`🔄 Individual update: Updating ${friend.nickname}...`);
    try {
      await updateFriendLcryptData(friend, false);
      console.log(`✅ Individual update: ${friend.nickname} completed`);
    } catch (error) {
      console.error(`❌ Individual update failed for ${friend.nickname}:`, error);
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

    if (!isManual && !canUpdate(45000)) {
      return;
    }

    setIsManualUpdate(isManual);
    stopIndividualUpdates();
    startLoading();
    
    const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));
    console.log(`🚀 Loading: Starting data fetch for ${sortedFriends.length} friends...`);
    
    if (isManual) {
      setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));
    } else {
      setFriendsWithLcrypt(sortedFriends.map(f => ({ ...f, lcryptData: undefined })));
    }
    
    const batchSize = 3;
    const updatedFriends: FriendWithLcrypt[] = [];
    
    for (let i = 0; i < sortedFriends.length; i += batchSize) {
      const batch = sortedFriends.slice(i, i + batchSize);
      
      try {
        const validResults = await friendDataProcessor.processFriendsBatch(
          batch,
          (friend) => updateFriendLcryptData(friend, true)
        );
        
        updatedFriends.push(...validResults);
        updateProgress(i + batch.length, sortedFriends.length, i, batchSize);
      } catch (error) {
        console.error('Error processing batch:', error);
      }
      
      if (i + batchSize < sortedFriends.length) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    finishLoading();
    setIsManualUpdate(false);
    console.log(`✅ Loading completed: Data fetch for all friends completed successfully`);
    
    setTimeout(() => {
      startIndividualUpdates();
    }, 45000);
    
  }, [friends, enabled, updateFriendLcryptData, canUpdate, startLoading, finishLoading, updateProgress, stopIndividualUpdates, startIndividualUpdates]);

  useEffect(() => {
    if (!enabled || friends.length === 0) return;

    loadLcryptDataForAllFriends(false);

    return () => {
      stopIndividualUpdates();
    };
  }, [friends, enabled, loadLcryptDataForAllFriends, stopIndividualUpdates]);

  useEffect(() => {
    return () => {
      stopIndividualUpdates();
    };
  }, [stopIndividualUpdates]);

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
