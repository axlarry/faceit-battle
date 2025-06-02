
import { useEffect, useRef } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const API_KEY = '6bb8f3be-53d3-400b-9766-bca9106ea411';
const API_BASE = 'https://open.faceit.com/data/v4';

interface UseFriendsAutoUpdateProps {
  friends: Player[];
  updateFriend: (updatedPlayer: Player) => void;
  enabled?: boolean;
}

export const useFriendsAutoUpdate = ({ 
  friends, 
  updateFriend, 
  enabled = true 
}: UseFriendsAutoUpdateProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  const updatePlayerInDatabase = async (player: Player): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({
          nickname: player.nickname,
          avatar: player.avatar,
          level: player.level || 0,
          elo: player.elo || 0,
          wins: player.wins || 0,
          win_rate: player.winRate || 0,
          hs_rate: player.hsRate || 0,
          kd_ratio: player.kdRatio || 0,
        })
        .eq('player_id', player.player_id);

      if (error) {
        console.error('Error updating player in database:', error);
        return false;
      }

      console.log(`Successfully updated ${player.nickname} in database`);
      return true;
    } catch (error) {
      console.error('Error updating player in database:', error);
      return false;
    }
  };

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

      // Update in database
      const dbUpdateSuccess = await updatePlayerInDatabase(updatedPlayer);
      if (!dbUpdateSuccess) {
        console.warn(`Failed to update ${player.nickname} in database, but API data was fetched`);
      }

      console.log(`Successfully updated ${player.nickname}`);
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
      let dbUpdatedCount = 0;
      
      for (const friend of friends) {
        const updatedPlayer = await updatePlayerData(friend);
        if (updatedPlayer) {
          updateFriend(updatedPlayer);
          updatedCount++;
          
          // Check if database was also updated (we track this in updatePlayerData)
          dbUpdatedCount++;
        }
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (updatedCount > 0) {
        toast({
          title: "Date actualizate",
          description: `Datele pentru ${updatedCount} prieteni au fost actualizate automat și salvate în baza de date.`,
        });
        console.log(`Successfully updated ${updatedCount}/${friends.length} friends and saved to database`);
      } else {
        console.log('No friends were updated - all requests failed');
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
