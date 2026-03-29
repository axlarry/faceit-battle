
import { useState, useCallback } from 'react';

export const useLcryptLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFriends, setLoadingFriends] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLastUpdateTime(Date.now());
  }, []);

  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingProgress(100);
  }, []);

  const updateProgress = useCallback((current: number, total: number, _batchStart: number, _batchSize: number) => {
    const progress = Math.min(100, (current / total) * 100);
    setLoadingProgress(progress);
  }, []);

  // Returns true if enough time has passed since the last full batch reload
  const canUpdate = useCallback((minIntervalMs: number = 90000) => {
    const now = Date.now();
    if (lastUpdateTime > 0 && (now - lastUpdateTime) < minIntervalMs) {
      return false;
    }
    return true;
  }, [lastUpdateTime]);

  return {
    isLoading,
    loadingProgress,
    loadingFriends,
    lastUpdateTime,
    setLoadingFriends,
    startLoading,
    finishLoading,
    updateProgress,
    canUpdate
  };
};
