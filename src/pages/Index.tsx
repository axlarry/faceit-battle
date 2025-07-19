
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
  console.log('🎯 Index: PlayerModal props:', { selectedPlayer: selectedPlayer?.nickname, showModal });

  return (
    <div className="min-h-screen bg-[#0d1117] relative">
      {/* Background image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <img 
          src="/faceit-icons/background.webp" 
          alt="" 
          className="w-full h-full object-cover opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6500]/5 via-transparent to-[#ff6500]/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjY1MDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="relative z-10">
        <Header />
        
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
