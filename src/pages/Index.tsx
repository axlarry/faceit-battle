import { useState, useEffect } from "react";
import { Header } from "@/components/faceit/Header";
import { RegionTabs } from "@/components/faceit/RegionTabs";
import { LeaderboardTable } from "@/components/faceit/LeaderboardTable";
import { FriendsSection } from "@/components/faceit/FriendsSection";
import { PlayerModal } from "@/components/faceit/PlayerModal";
import { toast } from "@/hooks/use-toast";

export interface Player {
  player_id: string;
  nickname: string;
  avatar: string;
  position?: number;
  level?: number;
  elo?: number;
  wins?: number;
  winRate?: number;
  hsRate?: number;
  kdRatio?: number;
}

// Configurează aici URL-ul API-ului tău
const API_URL = 'http://your-server-ip:3001/api'; // Înlocuiește cu IP-ul serverului tău

const Index = () => {
  const [currentRegion, setCurrentRegion] = useState('EU');
  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const showPlayerDetails = (player: Player) => {
    setSelectedPlayer(player);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900/20 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-4 py-8 space-y-8">
          <RegionTabs 
            currentRegion={currentRegion}
            onRegionChange={setCurrentRegion}
          />

          {currentRegion === 'FRIENDS' ? (
            <FriendsSection
              friends={friends}
              onAddFriend={addFriend}
              onRemoveFriend={removeFriend}
              onShowPlayerDetails={showPlayerDetails}
            />
          ) : (
            <LeaderboardTable
              region={currentRegion}
              onShowPlayerDetails={showPlayerDetails}
              onAddFriend={addFriend}
            />
          )}
        </div>

        <PlayerModal
          player={selectedPlayer}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAddFriend={addFriend}
          onRemoveFriend={removeFriend}
          isFriend={selectedPlayer ? friends.some(f => f.player_id === selectedPlayer.player_id) : false}
        />
      </div>
    </div>
  );
};

export default Index;
