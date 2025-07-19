import { useState, useEffect } from 'react';
import { faceitAnalyserService } from '@/services/faceitAnalyserService';
import { FaceitAnalyserPlayerData } from '@/types/FaceitAnalyser';
import { Player } from '@/types/Player';

export const useFaceitAnalyser = (player: Player | null) => {
  const [analyserData, setAnalyserData] = useState<FaceitAnalyserPlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player?.player_id) {
      setAnalyserData(null);
      return;
    }

    const fetchAnalyserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await faceitAnalyserService.getCompletePlayerData(
          player.player_id,
          player.nickname
        );
        
        setAnalyserData(data);
      } catch (err) {
        console.error('Error fetching analyser data:', err);
        setError('Failed to load advanced statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyserData();
  }, [player?.player_id, player?.nickname]);

  const refetch = async () => {
    if (!player?.player_id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await faceitAnalyserService.getCompletePlayerData(
        player.player_id,
        player.nickname
      );
      
      setAnalyserData(data);
    } catch (err) {
      console.error('Error refetching analyser data:', err);
      setError('Failed to refresh advanced statistics');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyserData,
    isLoading,
    error,
    refetch
  };
};