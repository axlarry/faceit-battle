
import { useState } from "react";
import { Header } from "@/components/faceit/Header";
import { RegionTabs } from "@/components/faceit/RegionTabs";
import { LeaderboardTable } from "@/components/faceit/LeaderboardTable";
import { FriendsSection } from "@/components/faceit/FriendsSection";
import { FaceitTool } from "@/components/faceit/FaceitTool";
import { PlayerModal } from "@/components/faceit/PlayerModal";
import { useFriends } from "@/hooks/useFriends";
import { usePlayerModal } from "@/hooks/usePlayerModal";

const Index = () => {
  const [currentRegion, setCurrentRegion] = useState('FRIENDS');
  const { friends, addFriend, updateFriend, removeFriend } = useFriends();
  const { selectedPlayer, showModal, showPlayerDetails, closeModal } = usePlayerModal();

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
              onUpdateFriend={updateFriend}
              onRemoveFriend={removeFriend}
              onShowPlayerDetails={showPlayerDetails}
            />
          ) : currentRegion === 'FACEIT_TOOL' ? (
            <FaceitTool
              onShowPlayerDetails={showPlayerDetails}
              onAddFriend={addFriend}
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
          onClose={closeModal}
          onAddFriend={addFriend}
          onRemoveFriend={removeFriend}
          isFriend={selectedPlayer ? friends.some(f => f.player_id === selectedPlayer.player_id) : false}
        />
      </div>
    </div>
  );
};

export default Index;
