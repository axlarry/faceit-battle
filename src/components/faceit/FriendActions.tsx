
import React, { useState } from 'react';

interface FriendActionsProps {
  nickname: string;
  steamId64: string | null;
  onLinkClick: (e: React.MouseEvent) => void;
}

export const FriendActions = ({ nickname, steamId64, onLinkClick }: FriendActionsProps) => {
  const [faceitIconError, setFaceitIconError] = useState(false);
  const [steamIconError, setSteamIconError] = useState(false);

  const handleFaceitIconError = () => {
    console.error('Failed to load Faceit icon from: ./icons/faceit_icon.svg');
    setFaceitIconError(true);
  };

  const handleSteamIconError = () => {
    console.error('Failed to load Steam icon from: ./icons/steam_icon.svg');
    setSteamIconError(true);
  };

  return (
    <div className="flex gap-1 mt-2 sm:mt-0" onClick={onLinkClick}>
      <a
        href={`https://www.faceit.com/en/players/${nickname}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg w-10 h-10 sm:w-12 sm:h-12 font-bold text-xs flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {!faceitIconError ? (
          <img 
            src="./icons/faceit_icon.svg" 
            alt="Faceit" 
            className="w-5 h-5 sm:w-6 sm:h-6"
            onError={handleFaceitIconError}
            onLoad={() => console.log('✅ Faceit icon loaded successfully from ./icons/faceit_icon.svg')}
          />
        ) : (
          <span className="text-xs font-bold">F</span>
        )}
      </a>
      <a
        href={steamId64 ? `https://steamcommunity.com/profiles/${steamId64}` : `https://steamcommunity.com/search/users/#text=${nickname}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white rounded-lg w-10 h-10 sm:w-12 sm:h-12 font-bold text-xs flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {!steamIconError ? (
          <img 
            src="./icons/steam_icon.svg" 
            alt="Steam" 
            className="w-5 h-5 sm:w-6 sm:h-6"
            onError={handleSteamIconError}
            onLoad={() => console.log('✅ Steam icon loaded successfully from ./icons/steam_icon.svg')}
          />
        ) : (
          <span className="text-xs font-bold">S</span>
        )}
      </a>
    </div>
  );
};
