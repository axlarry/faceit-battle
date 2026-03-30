
import { useState, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';

interface UseIndividualUpdatesProps {
  friends: Player[];
  enabled: boolean;
  updateSingleFriend: (friend: Player) => Promise<void>;
}

// Process 3 friends concurrently — respects lcrypt's 2s global queue since each
// batch of 3 triggers 3 parallel edge-function calls which the server queue
// serialises at 2s apart. The 2s inter-batch gap lets the queue drain fully
// before the next batch starts.
const BATCH_SIZE = 3;
const INTER_BATCH_DELAY_MS = 2000;
// How long to rest between full cycles. With a 120s server cache the next
// cycle will be entirely (or mostly) served from cache and finish in ~24s.
const CYCLE_RESTART_DELAY_MS = 30000;

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
        // ── Active phase: process all friends in batches of BATCH_SIZE ──
        for (let i = 0; i < friends.length; i += BATCH_SIZE) {
          if (stopSignalRef.current) break;

          const batch = friends.slice(i, i + BATCH_SIZE);

          // Run the batch concurrently; errors per-friend are swallowed so one
          // failed request doesn't abort the whole batch.
          await Promise.all(
            batch.map(f => updateSingleFriend(f).catch(() => {}))
          );

          if (stopSignalRef.current) break;

          // Gap between batches (not after the last one)
          if (i + BATCH_SIZE < friends.length) {
            await new Promise<void>(r => setTimeout(r, INTER_BATCH_DELAY_MS));
          }
        }

        if (stopSignalRef.current) break;

        // ── Rest phase: wait for server cache to age before next cycle ──
        setIsIndividualUpdating(false);
        await new Promise<void>(r => setTimeout(r, CYCLE_RESTART_DELAY_MS));
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
