
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

const Index = () => {
  const [currentRegion, setCurrentRegion] = useState('EU');
  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load friends from localStorage
  useEffect(() => {
    const savedFriends = localStorage.getItem('faceit_friends');
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    }
  }, []);

  // Save friends to localStorage
  const saveFriends = (newFriends: Player[]) => {
    setFriends(newFriends);
    localStorage.setItem('faceit_friends', JSON.stringify(newFriends));
  };

  const addFriend = (player: Player) => {
    const exists = friends.some(f => f.player_id === player.player_id);
    if (!exists) {
      const newFriends = [...friends, player];
      saveFriends(newFriends);
      toast({
        title: "Prieten adăugat!",
        description: `${player.nickname} a fost adăugat în lista ta de prieteni.`,
      });
    } else {
      toast({
        title: "Deja prieten",
        description: `${player.nickname} este deja în lista ta de prieteni.`,
        variant: "destructive",
      });
    }
  };

  const removeFriend = (playerId: string) => {
    const newFriends = friends.filter(f => f.player_id !== playerId);
    saveFriends(newFriends);
    toast({
      title: "Prieten șters",
      description: "Jucătorul a fost șters din lista de prieteni.",
    });
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
