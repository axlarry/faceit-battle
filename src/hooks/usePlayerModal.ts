
import { useState } from 'react';
import { Player } from '@/types/Player';

export const usePlayerModal = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);

  const showPlayerDetails = (player: Player) => {
    console.log('🎯 usePlayerModal: showing player details for:', player.nickname);
    setSelectedPlayer(player);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  return {
    selectedPlayer,
    showModal,
    showPlayerDetails,
    closeModal
  };
};
