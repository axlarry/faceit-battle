import { useState, useEffect } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useFriends = () => {
  const [friends, setFriends] = useState<Player[]>([]);

  // Load friends from Supabase
  useEffect(() => {
    loadFriendsFromDatabase();
  }, []);

  const loadFriendsFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading friends:', error);
        toast({
          title: "Eroare la încărcare",
          description: "Nu s-au putut încărca prietenii din baza de date.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        const friendsData: Player[] = data.map(friend => ({
          player_id: friend.player_id,
          nickname: friend.nickname,
          avatar: friend.avatar,
          level: friend.level || 0,
          elo: friend.elo || 0,
          wins: friend.wins || 0,
          winRate: friend.win_rate || 0,
          hsRate: friend.hs_rate || 0,
          kdRatio: friend.kd_ratio || 0,
        }));
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error loading friends from database:', error);
      toast({
        title: "Eroare la încărcare",
        description: "Nu s-au putut încărca prietenii din baza de date.",
        variant: "destructive",
      });
    }
  };

  const addFriend = async (player: Player) => {
    const exists = friends.some(f => f.player_id === player.player_id);
    if (!exists) {
      try {
        const { error } = await supabase
          .from('friends')
          .insert({
            player_id: player.player_id,
            nickname: player.nickname,
            avatar: player.avatar,
            level: player.level || 0,
            elo: player.elo || 0,
            wins: player.wins || 0,
            win_rate: player.winRate || 0,
            hs_rate: player.hsRate || 0,
            kd_ratio: player.kdRatio || 0,
          });

        if (error) {
          console.error('Error adding friend:', error);
          toast({
            title: "Eroare la adăugare",
            description: "Nu s-a putut adăuga prietenul în baza de date.",
            variant: "destructive",
          });
          return;
        }

        const updatedFriends = [...friends, player];
        setFriends(updatedFriends);
        
        toast({
          title: "Prieten adăugat!",
          description: `${player.nickname} a fost adăugat în lista de prieteni.`,
        });
      } catch (error) {
        console.error('Error adding friend:', error);
        toast({
          title: "Eroare la adăugare",
          description: "Nu s-a putut adăuga prietenul.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Deja în listă",
        description: `${player.nickname} este deja în lista de prieteni.`,
        variant: "destructive",
      });
    }
  };

  const updateFriend = async (updatedPlayer: Player) => {
    try {
      console.log(`Updating friend ${updatedPlayer.nickname} in database...`, updatedPlayer);
      
      const { error } = await supabase
        .from('friends')
        .update({
          nickname: updatedPlayer.nickname,
          avatar: updatedPlayer.avatar,
          level: updatedPlayer.level || 0,
          elo: updatedPlayer.elo || 0,
          wins: updatedPlayer.wins || 0,
          win_rate: updatedPlayer.winRate || 0,
          hs_rate: updatedPlayer.hsRate || 0,
          kd_ratio: updatedPlayer.kdRatio || 0,
        })
        .eq('player_id', updatedPlayer.player_id);

      if (error) {
        console.error('Error updating friend in database:', error);
        throw error;
      }

      console.log(`Successfully updated ${updatedPlayer.nickname} in database`);

      // Update local state only after successful database update
      setFriends(prevFriends => 
        prevFriends.map(f => 
          f.player_id === updatedPlayer.player_id ? updatedPlayer : f
        )
      );
      
    } catch (error) {
      console.error('Error updating friend:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const removeFriend = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('player_id', playerId);

      if (error) {
        console.error('Error removing friend:', error);
        toast({
          title: "Eroare la ștergere",
          description: "Nu s-a putut șterge prietenul din baza de date.",
          variant: "destructive",
        });
        return;
      }

      const updatedFriends = friends.filter(f => f.player_id !== playerId);
      setFriends(updatedFriends);
      
      toast({
        title: "Prieten șters",
        description: "Jucătorul a fost șters din lista de prieteni.",
      });
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Eroare la ștergere",
        description: "Nu s-a putut șterge prietenul din listă.",
        variant: "destructive",
      });
    }
  };

  return {
    friends,
    addFriend,
    updateFriend,
    removeFriend,
    loadFriendsFromDatabase
  };
};
