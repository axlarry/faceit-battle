
import { useState, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';

interface UseIndividualUpdatesProps {
  friends: Player[];
  enabled: boolean;
  updateSingleFriend: (friend: Player) => Promise<void>;
}

// Delay between requests — must exceed lcrypt's 2s global queue minimum
const INTER_REQUEST_DELAY_MS = 2500;
// How long to wait after a full cycle before starting the next one
const CYCLE_RESTART_DELAY_MS = 45000;

export const useIndividualUpdates = ({
  friends,
  enabled,
  updateSingleFriend
}: UseIndividualUpdatesProps) => {
  const [isIndividualUpdating, setIsIndividualUpdating] = useState(false);

  const stopSignalRef = useRef(false);
  const runningRef = useRef(false);

  const startIndividualUpdates = useCallback(() => {
    if (!enabled || friends.length === 0 || runningRef.current) return;

    stopSignalRef.current = false;
    runningRef.current = true;
    setIsIndividualUpdating(true);

    const runCycle = async () => {
      while (!stopSignalRef.current) {
        for (let i = 0; i < friends.length; i++) {
          if (stopSignalRef.current) break;

          try {
            await updateSingleFriend(friends[i]);
          } catch {
            // continue to next friend on error
          }

          if (stopSignalRef.current) break;

          // Wait between requests to respect lcrypt's 2s global queue
          await new Promise<void>(resolve => setTimeout(resolve, INTER_REQUEST_DELAY_MS));
        }

        if (stopSignalRef.current) break;

        // Pause between full cycles — lets server cache expire so next cycle gets fresh data
        setIsIndividualUpdating(false);
        await new Promise<void>(resolve => setTimeout(resolve, CYCLE_RESTART_DELAY_MS));

        if (stopSignalRef.current) break;
        setIsIndividualUpdating(true);
      }

      runningRef.current = false;
      setIsIndividualUpdating(false);
    };

    runCycle();
  }, [friends, enabled, updateSingleFriend]);

  const stopIndividualUpdates = useCallback(() => {
    stopSignalRef.current = true;
    runningRef.current = false;
    setIsIndividualUpdating(false);
  }, []);

  return {
    isIndividualUpdating,
    startIndividualUpdates,
    stopIndividualUpdates
  };
};
