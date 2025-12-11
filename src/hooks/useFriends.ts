import { useState, useEffect } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

export const useFriends = () => {
  const [friends, setFriends] = useState<Player[]>([]);

  // Load friends from Supabase
  useEffect(() => {
    loadFriendsFromDatabase();
  }, []);

  const loadFriendsFromDatabase = async (refreshData = true) => {
    try {
      // First load existing data immediately
      const { data, error } = await invokeFunction('friends-gateway', { action: 'list' });

      if (error) {
        console.error('Error loading friends via gateway:', error);
        toast({
          title: "Eroare la încărcare",
          description: "Nu s-au putut încărca prietenii (gateway).",
          variant: "destructive",
        });
        return;
      }

      const items = (data as any)?.items || [];
      const friendsData: Player[] = items.map((friend: any) => ({
        player_id: friend.player_id,
        nickname: friend.nickname,
        avatar: friend.avatar,
        level: friend.level || 0,
        elo: friend.elo || 0,
        wins: friend.wins || 0,
        winRate: friend.winRate || 0,
        hsRate: friend.hsRate || 0,
        kdRatio: friend.kdRatio || 0,
      }));
      setFriends(friendsData);

      // Then refresh all friends data in the background if requested
      if (refreshData) {
        console.log('🔄 Refreshing friends data from lcrypt in background...');
        invokeFunction('friends-gateway', { action: 'refresh_all' }).then(({ data: refreshData, error: refreshError }) => {
          if (refreshError) {
            console.warn('Failed to refresh friends data:', refreshError);
          } else {
            console.log(`✅ Refreshed ${(refreshData as any)?.updated || 0}/${(refreshData as any)?.total || 0} friends`);
            // Reload the data after refresh
            loadFriendsFromDatabase(false);
          }
        }).catch((refreshErr: unknown) => {
          console.warn('Error refreshing friends data:', refreshErr);
        });
      }
    } catch (error) {
      console.error('Error loading friends from gateway:', error);
      toast({
        title: "Eroare la încărcare",
        description: "Nu s-au putut încărca prietenii din gateway.",
        variant: "destructive",
      });
    }
  };

  const addFriend = async (player: Player, password: string) => {
    const exists = friends.some(f => f.player_id === player.player_id);
    if (!exists) {
      try {
        const { error } = await invokeFunction('friends-gateway', {
          action: 'add',
          password,
          player: {
            player_id: player.player_id,
            nickname: player.nickname,
            avatar: player.avatar,
            level: player.level || 0,
            elo: player.elo || 0,
            wins: player.wins || 0,
            win_rate: player.winRate || 0,
            hs_rate: player.hsRate || 0,
            kd_ratio: player.kdRatio || 0,
          }
        });

        if (error) {
          console.error('Error adding friend (gateway):', error);
          toast({
            title: "Eroare la adăugare",
            description: (error as any).message || "Parolă invalidă sau eroare la gateway.",
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

  const updateFriend = async (updatedPlayer: Player, password?: string) => {
    try {
      console.log(`Updating friend ${updatedPlayer.nickname} via gateway...`, updatedPlayer);

      const { error } = await invokeFunction('friends-gateway', {
        action: 'update',
        password,
        player: {
          player_id: updatedPlayer.player_id,
          nickname: updatedPlayer.nickname,
          avatar: updatedPlayer.avatar,
          level: updatedPlayer.level || 0,
          elo: updatedPlayer.elo || 0,
          wins: updatedPlayer.wins || 0,
          win_rate: updatedPlayer.winRate || 0,
          hs_rate: updatedPlayer.hsRate || 0,
          kd_ratio: updatedPlayer.kdRatio || 0,
        }
      });

      if (error) {
        console.error('Error updating friend in gateway:', error);
        throw error;
      }

      console.log(`Successfully updated ${updatedPlayer.nickname} in gateway`);

      setFriends(prevFriends => 
        prevFriends.map(f => 
          f.player_id === updatedPlayer.player_id ? updatedPlayer : f
        )
      );
      
    } catch (error) {
      console.error('Error updating friend:', error);
      throw error;
    }
  };

  const removeFriend = async (playerId: string, password: string) => {
    try {
      const { error } = await invokeFunction('friends-gateway', {
        action: 'remove',
        password,
        playerId
      });

      if (error) {
        console.error('Error removing friend (gateway):', error);
        toast({
          title: "Eroare la ștergere",
          description: "Parolă invalidă sau eroare la gateway.",
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

  const refreshFriendsData = async () => {
    await loadFriendsFromDatabase(true);
  };

  return {
    friends,
    addFriend,
    updateFriend,
    removeFriend,
    loadFriendsFromDatabase,
    refreshFriendsData
  };
};
