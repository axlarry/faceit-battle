
import { useRef } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';
import { usePlayerDataUpdater } from '@/hooks/usePlayerDataUpdater';

interface UseBulkFriendsUpdateProps {
  friends: Player[];
  updateFriend: (updatedPlayer: Player) => void;
  reloadFriends: () => void;
}

export const useBulkFriendsUpdate = ({ 
  friends, 
  updateFriend, 
  reloadFriends 
}: UseBulkFriendsUpdateProps) => {
  const isUpdatingRef = useRef(false);
  const { updatePlayerData } = usePlayerDataUpdater();

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

  return {
    isUpdating: isUpdatingRef.current,
    updateAllFriends
  };
};
