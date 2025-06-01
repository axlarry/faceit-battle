
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
    <div className="min-h-screen bg-[#0d1117]">
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6500]/5 via-transparent to-[#ff6500]/5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjY1MDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 max-w-7xl">
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
