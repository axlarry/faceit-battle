
import { useState, useEffect } from 'react';
import { Player } from '@/types/Player';
import { toast } from '@/hooks/use-toast';

export const useFriends = () => {
  const [friends, setFriends] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load friends from localStorage
  const loadFriends = () => {
    try {
      console.log('📱 Loading friends from localStorage');
      const savedFriends = localStorage.getItem('faceit-friends');
      if (savedFriends) {
        const parsedFriends = JSON.parse(savedFriends);
        console.log(`✅ Loaded ${parsedFriends.length} friends from localStorage`);
        setFriends(parsedFriends);
      } else {
        console.log('📝 No friends found in localStorage, starting with empty list');
        setFriends([]);
      }
    } catch (error) {
      console.error('❌ Error loading friends from localStorage:', error);
      setError('Failed to load friends');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // Save friends to localStorage
  const saveFriends = (friendsList: Player[]) => {
    try {
      localStorage.setItem('faceit-friends', JSON.stringify(friendsList));
      console.log(`💾 Saved ${friendsList.length} friends to localStorage`);
    } catch (error) {
      console.error('❌ Error saving friends to localStorage:', error);
      toast({
        title: "Eroare la salvare",
        description: "Nu s-au putut salva prietenii",
        variant: "destructive",
      });
    }
  };

  // Add friend - now async to match expected type
  const addFriend = async (player: Player) => {
    const updatedFriends = [...friends, player];
    setFriends(updatedFriends);
    saveFriends(updatedFriends);
    
    toast({
      title: "Prieten adăugat",
      description: `${player.nickname} a fost adăugat în lista de prieteni`,
    });
  };

  // Remove friend
  const removeFriend = (playerId: string) => {
    const updatedFriends = friends.filter(friend => friend.player_id !== playerId);
    setFriends(updatedFriends);
    saveFriends(updatedFriends);
    
    const removedFriend = friends.find(f => f.player_id === playerId);
    if (removedFriend) {
      toast({
        title: "Prieten șters",
        description: `${removedFriend.nickname} a fost șters din lista de prieteni`,
      });
    }
  };

  // Update friend
  const updateFriend = (updatedPlayer: Player) => {
    const updatedFriends = friends.map(friend => 
      friend.player_id === updatedPlayer.player_id ? updatedPlayer : friend
    );
    setFriends(updatedFriends);
    saveFriends(updatedFriends);
  };

  // Reload friends (refresh from localStorage)
  const reloadFriends = () => {
    loadFriends();
  };

  // Initialize friends on mount
  useEffect(() => {
    loadFriends();
  }, []);

  return {
    friends,
    loading,
    error,
    addFriend,
    removeFriend,
    updateFriend,
    reloadFriends
  };
};
