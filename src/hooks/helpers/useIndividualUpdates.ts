
import { useState, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';

interface UseIndividualUpdatesProps {
  friends: Player[];
  enabled: boolean;
  updateSingleFriend: (friend: Player) => Promise<void>;
}

export const useIndividualUpdates = ({ 
  friends, 
  enabled, 
  updateSingleFriend 
}: UseIndividualUpdatesProps) => {
  const [isIndividualUpdating, setIsIndividualUpdating] = useState(false);
  
  const individualUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const individualUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPlayerIndexRef = useRef(0);

  const startIndividualUpdates = useCallback(() => {
    if (!enabled || friends.length === 0) return;

    console.log(`🚀 Starting individual updates cycle for ${friends.length} friends (1 player every 1.2s)`);
    setIsIndividualUpdating(true);
    currentPlayerIndexRef.current = 0;

    const updateNextPlayer = () => {
      if (currentPlayerIndexRef.current >= friends.length) {
        console.log(`✅ Individual updates cycle completed. Next cycle in 45 seconds.`);
        currentPlayerIndexRef.current = 0;
        setIsIndividualUpdating(false);
        
        individualUpdateTimeoutRef.current = setTimeout(() => {
          startIndividualUpdates();
        }, 45000);
        
        return;
      }

      const currentFriend = friends[currentPlayerIndexRef.current];
      updateSingleFriend(currentFriend);
      currentPlayerIndexRef.current++;

      individualUpdateIntervalRef.current = setTimeout(updateNextPlayer, 1200);
    };

    updateNextPlayer();
  }, [friends, enabled, updateSingleFriend]);

  const stopIndividualUpdates = useCallback(() => {
    if (individualUpdateTimeoutRef.current) {
      clearTimeout(individualUpdateTimeoutRef.current);
      individualUpdateTimeoutRef.current = null;
    }
    if (individualUpdateIntervalRef.current) {
      clearTimeout(individualUpdateIntervalRef.current);
      individualUpdateIntervalRef.current = null;
    }
    setIsIndividualUpdating(false);
    console.log('🛑 Individual updates stopped');
  }, []);

  return {
    isIndividualUpdating,
    startIndividualUpdates,
    stopIndividualUpdates
  };
};
