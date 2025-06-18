
import { useState } from 'react';
import { Player } from '@/types/Player';

export const useFlashingPlayer = (onShowPlayerDetails: (player: Player) => void) => {
  const [flashingPlayer, setFlashingPlayer] = useState<string | null>(null);

  const handlePlayerClick = (player: Player) => {
    setFlashingPlayer(player.player_id);
    setTimeout(() => {
      setFlashingPlayer(null);
      onShowPlayerDetails(player);
    }, 200);
  };

  return {
    flashingPlayer,
    handlePlayerClick
  };
};
