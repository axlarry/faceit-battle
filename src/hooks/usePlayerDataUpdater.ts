
import { Player } from '@/types/Player';
import { useFaceitApi } from '@/hooks/useFaceitApi';

export const usePlayerDataUpdater = () => {
  const { makeApiCall } = useFaceitApi();

  const updatePlayerData = async (player: Player): Promise<Player | null> => {
    try {
      console.log(`Updating player data for ${player.nickname} (ID: ${player.player_id})`);
      
      // Get player basic data using the Supabase API
      const playerData = await makeApiCall(`/players/${player.player_id}`);
      
      // Get additional stats
      let statsData: any = {};
      try {
        statsData = await makeApiCall(`/players/${player.player_id}/stats/cs2`);
      } catch (error) {
        console.warn(`Could not fetch stats for ${player.nickname}:`, error);
      }

      const updatedPlayer: Player = {
        player_id: playerData.player_id,
        nickname: playerData.nickname,
        avatar: playerData.avatar || player.avatar,
        level: playerData.games?.cs2?.skill_level || player.level || 0,
        elo: playerData.games?.cs2?.faceit_elo || player.elo || 0,
        wins: parseInt(statsData.lifetime?.Wins) || player.wins || 0,
        winRate: Math.round((parseInt(statsData.lifetime?.Wins) / parseInt(statsData.lifetime?.Matches)) * 100) || player.winRate || 0,
        hsRate: parseFloat(statsData.lifetime?.['Average Headshots %']) || player.hsRate || 0,
        kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio']) || player.kdRatio || 0,
      };

      console.log(`Successfully updated ${player.nickname}`, updatedPlayer);
      return updatedPlayer;
    } catch (error) {
      console.error(`Error updating data for ${player.nickname}:`, error);
      return null;
    }
  };

  return { updatePlayerData };
};
