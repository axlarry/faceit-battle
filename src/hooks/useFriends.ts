
import { useState, useEffect } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';

const FRIENDS_STORAGE_KEY = 'faceit_friends';

export const useFriends = () => {
  const [friends, setFriends] = useState<Player[]>([]);

  // Load friends from localStorage
  useEffect(() => {
    loadFriendsFromStorage();
  }, []);

  const loadFriendsFromStorage = () => {
    try {
      const storedFriends = localStorage.getItem(FRIENDS_STORAGE_KEY);
      if (storedFriends) {
        const parsedFriends = JSON.parse(storedFriends);
        setFriends(parsedFriends);
      }
    } catch (error) {
      console.error('Error loading friends from localStorage:', error);
      toast({
        title: "Eroare la încărcare",
        description: "Nu s-au putut încărca prietenii din storage local.",
        variant: "destructive",
      });
    }
  };

  const saveFriendsToStorage = (friendsList: Player[]) => {
    try {
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friendsList));
    } catch (error) {
      console.error('Error saving friends to localStorage:', error);
      toast({
        title: "Eroare la salvare",
        description: "Nu s-au putut salva prietenii în storage local.",
        variant: "destructive",
      });
    }
  };

  const addFriend = async (player: Player) => {
    const exists = friends.some(f => f.player_id === player.player_id);
    if (!exists) {
      try {
        const updatedFriends = [...friends, player];
        setFriends(updatedFriends);
        saveFriendsToStorage(updatedFriends);
        
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

  const removeFriend = async (playerId: string) => {
    try {
      const updatedFriends = friends.filter(f => f.player_id !== playerId);
      setFriends(updatedFriends);
      saveFriendsToStorage(updatedFriends);
      
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
    removeFriend,
    loadFriendsFromDatabase: loadFriendsFromStorage
  };
};
