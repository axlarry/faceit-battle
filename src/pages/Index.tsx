
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
  const { friends, addFriend, updateFriend, removeFriend, loadFriendsFromDatabase } = useFriends();
  const { selectedPlayer, showModal, showPlayerDetails, closeModal } = usePlayerModal();

  return (
    <div className="min-h-screen relative bg-background cs2-animated-bg">
      {/* Enhanced CS2 background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 app-aurora animate-gradient-shift" />
        
        {/* CS2 Map Icons */}
        <div className="cs2-map-icons">
          <div className="cs2-map-icon"></div>
          <div className="cs2-map-icon"></div>
          <div className="cs2-map-icon"></div>
          <div className="cs2-map-icon"></div>
          <div className="cs2-map-icon"></div>
          <div className="cs2-map-icon"></div>
        </div>
      </div>

      <div className="relative z-10">
        <Header />
        <h1 className="sr-only">Faceit Friend Tracker – ELO, Prieteni și Leaderboard CS2</h1>
        
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl">
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
              onReloadFriends={loadFriendsFromDatabase}
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
