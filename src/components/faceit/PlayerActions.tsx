
import { Button } from "@/components/ui/button";
import { Player } from "@/types/Player";
import { UserPlus, UserMinus } from "lucide-react";
import { useState } from "react";

interface PlayerActionsProps {
  player: Player;
  isFriend: boolean;
  onFriendAction: () => void;
}

export const PlayerActions = ({ player, isFriend, onFriendAction }: PlayerActionsProps) => {
  const [faceitIconError, setFaceitIconError] = useState(false);
  const [steamIconError, setSteamIconError] = useState(false);

  const handleFaceitIconError = () => {
    console.error('Failed to load Faceit icon from: /icons/faceit_icon.png');
    setFaceitIconError(true);
  };

  const handleSteamIconError = () => {
    console.error('Failed to load Steam icon from: /icons/steam_icon.png');
    setSteamIconError(true);
  };

  return (
    <div className="flex gap-4 justify-center">
      <Button
        onClick={onFriendAction}
        className={`px-6 py-3 font-medium text-base ${
          isFriend
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
        } text-white border-0`}
      >
        {isFriend ? (
          <>
            <UserMinus size={16} className="mr-2" />
            Șterge din Prieteni
          </>
        ) : (
          <>
            <UserPlus size={16} className="mr-2" />
            Adaugă la Prieteni
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white w-12 h-12 p-0"
        onClick={() => window.open(`https://www.faceit.com/en/players/${player.nickname}`, '_blank')}
      >
        {!faceitIconError ? (
          <img 
            src="/icons/faceit_icon.png" 
            alt="Faceit" 
            className="w-6 h-6"
            onError={handleFaceitIconError}
            onLoad={() => console.log('✅ Faceit icon loaded successfully from /icons/faceit_icon.png')}
          />
        ) : (
          <span className="text-lg font-bold">F</span>
        )}
      </Button>

      <Button
        variant="outline"
        className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white w-12 h-12 p-0"
        onClick={() => window.open(`https://steamcommunity.com/search/users/#text=${player.nickname}`, '_blank')}
      >
        {!steamIconError ? (
          <img 
            src="/icons/steam_icon.png" 
            alt="Steam" 
            className="w-6 h-6"
            onError={handleSteamIconError}
            onLoad={() => console.log('✅ Steam icon loaded successfully from /icons/steam_icon.png')}
          />
        ) : (
          <span className="text-lg font-bold">S</span>
        )}
      </Button>
    </div>
  );
};
