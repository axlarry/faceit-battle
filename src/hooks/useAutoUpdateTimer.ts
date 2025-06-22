
import { useEffect, useRef, useCallback } from 'react';

interface UseAutoUpdateTimerProps {
  enabled: boolean;
  itemCount: number;
  updateFunction: () => Promise<void>;
  intervalMs: number;
}

export const useAutoUpdateTimer = ({
  enabled,
  itemCount,
  updateFunction,
  intervalMs
}: UseAutoUpdateTimerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    
    if (!enabled || itemCount === 0) return;

    // Optimize interval based on number of items
    const optimizedInterval = Math.max(intervalMs, itemCount * 30000); // Min 30s per item

    intervalRef.current = setInterval(async () => {
      if (isRunningRef.current) return;
      
      isRunningRef.current = true;
      try {
        console.log(`🔄 Auto-update triggered for ${itemCount} items`);
        await updateFunction();
      } catch (error) {
        console.error('❌ Auto-update failed:', error);
      } finally {
        isRunningRef.current = false;
      }
    }, optimizedInterval);

    console.log(`⏰ Auto-update timer started with ${optimizedInterval}ms interval for ${itemCount} items`);
  }, [enabled, itemCount, updateFunction, intervalMs, clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      isRunningRef.current = false;
    };
  }, [clearTimer]);
};
