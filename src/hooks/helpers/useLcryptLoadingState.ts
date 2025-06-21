
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

  const updateProgress = useCallback((current: number, total: number, batchStart: number, batchSize: number) => {
    const progress = Math.min(100, (current / total) * 100);
    setLoadingProgress(progress);
    console.log(`📊 Progress: ${Math.round(progress)}% (${current}/${total}) - Processing rank ${batchStart + 1}-${Math.min(batchStart + batchSize, total)}`);
  }, []);

  const canUpdate = useCallback((minIntervalMs: number = 120000) => {
    const now = Date.now();
    if (lastUpdateTime > 0 && (now - lastUpdateTime) < minIntervalMs) {
      console.log(`⏱️ Skipping Lcrypt update, only ${Math.round((now - lastUpdateTime) / 1000)}s since last update. Waiting for 2 minutes between updates.`);
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
