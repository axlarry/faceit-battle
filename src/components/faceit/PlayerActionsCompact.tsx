
import React from 'react';

interface PlayerActionsCompactProps {
  nickname: string;
  steamId64: string | null;
  isLive: boolean;
  onLinkClick: (e: React.MouseEvent) => void;
}

export const PlayerActionsCompact = ({ nickname, steamId64, isLive, onLinkClick }: PlayerActionsCompactProps) => {
  return (
    <div className="flex gap-1" onClick={onLinkClick}>
      <a
        href={`https://www.faceit.com/en/players/${nickname}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`bg-transparent border text-xs transition-all duration-200 rounded-lg w-8 h-8 flex items-center justify-center ${
          isLive 
            ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-white shadow-green-400/20 shadow-md' 
            : 'border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white'
        }`}
      >
        <img 
          src="/faceit-icons/faceit_icon.png" 
          alt="F" 
          className="w-4 h-4"
          onError={(e) => {
            console.log('Faceit icon failed to load, using fallback');
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <span className="text-xs font-bold hidden">F</span>
      </a>
      <a
        href={steamId64 ? `https://steamcommunity.com/profiles/${steamId64}` : `https://steamcommunity.com/search/users/#text=${nickname}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`bg-transparent border text-xs transition-all duration-200 rounded-lg w-8 h-8 flex items-center justify-center ${
          isLive 
            ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-white shadow-green-400/20 shadow-md' 
            : 'border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white'
        }`}
      >
        <img 
          src="/faceit-icons/steam_icon.png" 
          alt="S" 
          className="w-4 h-4"
          onError={(e) => {
            console.log('Steam icon failed to load, using fallback');
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <span className="text-xs font-bold hidden">S</span>
      </a>
    </div>
  );
};
