
import { useEffect, useRef } from 'react';

interface UseAutoUpdateTimerProps {
  enabled: boolean;
  itemCount: number;
  updateFunction: () => Promise<void>;
  intervalMs?: number;
}

export const useAutoUpdateTimer = ({ 
  enabled, 
  itemCount, 
  updateFunction, 
  intervalMs = 900000 // 15 minutes default (15 * 60 * 1000)
}: UseAutoUpdateTimerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || itemCount === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval
    intervalRef.current = setInterval(updateFunction, intervalMs);
    
    // Clean up on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, itemCount, updateFunction, intervalMs]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};
