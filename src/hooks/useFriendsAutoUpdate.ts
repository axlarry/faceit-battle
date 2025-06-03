
import { useEffect, useRef } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';

const API_KEY = '5d81df9c-db61-494c-8e0a-d94c89bb7913';
const API_BASE = 'https://open.faceit.com/data/v4';

interface UseFriendsAutoUpdateProps {
  friends: Player[];
  updateFriend: (updatedPlayer: Player) => void;
  reloadFriends: () => void;
  enabled?: boolean;
}

export const useFriendsAutoUpdate = ({ 
  friends, 
  updateFriend,
  reloadFriends,
  enabled = true 
}: UseFriendsAutoUpdateProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  const updatePlayerData = async (player: Player): Promise<Player | null> => {
    try {
      console.log(`Updating player data for ${player.nickname} (ID: ${player.player_id})`);
      
      // Get player basic data
      const playerResponse = await fetch(
        `${API_BASE}/players/${player.player_id}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      if (!playerResponse.ok) {
        const errorData = await playerResponse.json().catch(() => ({}));
        console.error(`Failed to update data for ${player.nickname}:`, errorData);
        return null;
      }

      const playerData = await playerResponse.json();
      
      // Get additional stats
      const statsResponse = await fetch(`${API_BASE}/players/${player.player_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      
      let statsData: any = {};
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
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

  const updateAllFriends = async () => {
    if (isUpdatingRef.current || friends.length === 0) return;
    
    isUpdatingRef.current = true;
    console.log('Starting auto-update for', friends.length, 'friends...');
    
    try {
      let updatedCount = 0;
      
      for (const friend of friends) {
        const updatedPlayer = await updatePlayerData(friend);
        if (updatedPlayer) {
          console.log(`Saving updated data for ${updatedPlayer.nickname} to Supabase...`);
          try {
            await updateFriend(updatedPlayer);
            console.log(`Successfully updated and saved ${updatedPlayer.nickname} to database`);
            updatedCount++;
          } catch (error) {
            console.error(`Failed to save ${updatedPlayer.nickname} to database:`, error);
          }
        }
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (updatedCount > 0) {
        // Force reload from database to ensure UI shows latest data
        console.log('Reloading all friends from database to sync UI...');
        await reloadFriends();
        
        toast({
          title: "Date actualizate",
          description: `Datele pentru ${updatedCount} prieteni au fost actualizate și salvate în Supabase.`,
        });
        console.log(`Successfully updated ${updatedCount}/${friends.length} friends and synced with database`);
      } else {
        console.log('No friends were updated - all API requests failed');
        toast({
          title: "Eroare la actualizare",
          description: "Nu s-au putut actualiza datele prietenilor. Verifică conexiunea la API.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error during auto-update:', error);
      toast({
        title: "Eroare la actualizare",
        description: "Nu s-au putut actualiza toate datele prietenilor.",
        variant: "destructive",
      });
    } finally {
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled || friends.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval for 5 minutes (300000 ms)
    intervalRef.current = setInterval(updateAllFriends, 300000);
    
    // Clean up on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [friends.length, enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isUpdating: isUpdatingRef.current,
    updateAllFriends
  };
};
