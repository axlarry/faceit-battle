import { useState, useCallback, useRef } from 'react';
import { Player } from '@/types/Player';

export const useFlashingPlayer = (onShowPlayerDetails: (player: Player) => void) => {
  const [flashingPlayer, setFlashingPlayer] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlayerClick = useCallback((player: Player) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setFlashingPlayer(player.player_id);
    timeoutRef.current = setTimeout(() => {
      setFlashingPlayer(null);
      onShowPlayerDetails(player);
      timeoutRef.current = null;
    }, 200);
  }, [onShowPlayerDetails]);

  return {
    flashingPlayer,
    handlePlayerClick
  };
};
