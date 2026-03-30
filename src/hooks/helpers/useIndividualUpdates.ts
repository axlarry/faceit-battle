
import { useState, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';

interface UseIndividualUpdatesProps {
  friends: Player[];
  enabled: boolean;
  updateSingleFriend: (friend: Player) => Promise<void>;
}

const BATCH_SIZE = 3;

// When all 3 players in a batch are served from cache, the batch finishes
// in ~100-300ms. When one or more hit the lcrypt server queue (2s/request)
// the batch takes 4-8s. Using 800ms as threshold lets us distinguish the two
// cases and apply the appropriate inter-batch pause.
const FAST_BATCH_THRESHOLD_MS = 800;
const INTER_BATCH_DELAY_WARM_MS = 300;   // cache-hit batches: minimal gap
const INTER_BATCH_DELAY_COLD_MS = 2000;  // cache-miss batches: let lcrypt queue drain

// Rest between full cycles. With a 120s server cache the next cycle will be
// served mostly from cache (warm) and complete in ~4s.
const CYCLE_RESTART_DELAY_MS = 30000;

export const useIndividualUpdates = ({
  friends,
  enabled,
  updateSingleFriend
}: UseIndividualUpdatesProps) => {
  const [isIndividualUpdating, setIsIndividualUpdating] = useState(false);

  const stopSignalRef = useRef(false);
  const runningRef    = useRef(false);

  const startIndividualUpdates = useCallback(() => {
    if (!enabled || friends.length === 0 || runningRef.current) return;

    stopSignalRef.current = false;
    runningRef.current    = true;
    setIsIndividualUpdating(true);

    const runCycle = async () => {
      while (!stopSignalRef.current) {
        // ── Active phase ────────────────────────────────────────────────────
        for (let i = 0; i < friends.length; i += BATCH_SIZE) {
          if (stopSignalRef.current) break;

          const batch = friends.slice(i, i + BATCH_SIZE);
          const t0 = Date.now();

          await Promise.all(batch.map(f => updateSingleFriend(f).catch(() => {})));

          if (stopSignalRef.current) break;

          if (i + BATCH_SIZE < friends.length) {
            // Adaptive delay: fast completion means all data came from cache →
            // skip the long queue-drain pause.
            const batchMs = Date.now() - t0;
            const delay = batchMs < FAST_BATCH_THRESHOLD_MS
              ? INTER_BATCH_DELAY_WARM_MS
              : INTER_BATCH_DELAY_COLD_MS;
            await new Promise<void>(r => setTimeout(r, delay));
          }
        }
        // ────────────────────────────────────────────────────────────────────

        if (stopSignalRef.current) break;

        // ── Rest phase ──────────────────────────────────────────────────────
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
    runningRef.current    = false;
    setIsIndividualUpdating(false);
  }, []);

  return { isIndividualUpdating, startIndividualUpdates, stopIndividualUpdates };
};
