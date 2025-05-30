
import { useState, useEffect } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';

// Configurează aici URL-ul API-ului tău
const API_URL = 'http://localhost:3001/api'; // Pentru dezvoltare locală

export const useFriends = () => {
  const [friends, setFriends] = useState<Player[]>([]);

  // Load friends from MySQL database
  useEffect(() => {
    loadFriendsFromDatabase();
  }, []);

  const loadFriendsFromDatabase = async () => {
    try {
      const response = await fetch(`${API_URL}/friends`);
      if (response.ok) {
        const friendsData = await response.json();
        // Convert database format to frontend format
        const formattedFriends = friendsData.map((friend: any) => ({
          player_id: friend.player_id,
          nickname: friend.nickname,
          avatar: friend.avatar,
          level: friend.level,
          elo: friend.elo,
          wins: friend.wins,
          winRate: friend.win_rate,
          hsRate: friend.hs_rate,
          kdRatio: friend.kd_ratio,
        }));
        setFriends(formattedFriends);
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
        const response = await fetch(`${API_URL}/friends`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player_id: player.player_id,
            nickname: player.nickname,
            avatar: player.avatar,
            level: player.level || 0,
            elo: player.elo || 0,
            wins: player.wins || 0,
            win_rate: player.winRate || 0,
            hs_rate: player.hsRate || 0,
            kd_ratio: player.kdRatio || 0,
          }),
        });

        if (response.ok) {
          await loadFriendsFromDatabase(); // Reload friends list
          toast({
            title: "Prieten adăugat!",
            description: `${player.nickname} a fost adăugat în lista globală de prieteni.`,
          });
        } else {
          throw new Error('Failed to add friend');
        }
      } catch (error) {
        console.error('Error adding friend:', error);
        toast({
          title: "Eroare la adăugare",
          description: "Nu s-a putut adăuga prietenul în baza de date.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Deja în listă",
        description: `${player.nickname} este deja în lista globală de prieteni.`,
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (playerId: string) => {
    try {
      const response = await fetch(`${API_URL}/friends/${playerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFriendsFromDatabase(); // Reload friends list
        toast({
          title: "Prieten șters",
          description: "Jucătorul a fost șters din lista globală de prieteni.",
        });
      } else {
        throw new Error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Eroare la ștergere",
        description: "Nu s-a putut șterge prietenul din baza de date.",
        variant: "destructive",
      });
    }
  };

  return {
    friends,
    addFriend,
    removeFriend,
    loadFriendsFromDatabase
  };
};
