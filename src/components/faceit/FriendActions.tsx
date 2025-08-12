
import React, { useState } from 'react';

interface FriendActionsProps {
  nickname: string;
  steamId64: string | null;
  onLinkClick: (e: React.MouseEvent) => void;
}

export const FriendActions = ({ nickname, steamId64, onLinkClick }: FriendActionsProps) => {
  return (
    <div className="flex gap-2 mt-2 sm:mt-0" onClick={onLinkClick}>
      <a
        href={`https://www.faceit.com/en/players/${nickname}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-transparent border-0 text-[#ff6500] hover:border-2 hover:border-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg w-14 h-14 font-bold text-xs flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        <img 
          src="/faceit-icons/faceit_icon.png" 
          alt="F" 
          loading="lazy"
          className="w-12 h-12"
          onError={(e) => {
            console.log('✅ Faceit icon fallback activated');
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <span className="text-sm font-bold hidden">F</span>
      </a>
      <a
        href={steamId64 ? `https://steamcommunity.com/profiles/${steamId64}` : `https://steamcommunity.com/search/users/#text=${nickname}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-transparent border-0 text-blue-400 hover:border-2 hover:border-blue-400 hover:bg-blue-500 hover:text-white rounded-lg w-14 h-14 font-bold text-xs flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        <img 
          src="/faceit-icons/steam_icon.png" 
          alt="S" 
          loading="lazy"
          className="w-12 h-12"
          onError={(e) => {
            console.log('✅ Steam icon fallback activated');
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <span className="text-sm font-bold hidden">S</span>
      </a>
    </div>
  );
};
