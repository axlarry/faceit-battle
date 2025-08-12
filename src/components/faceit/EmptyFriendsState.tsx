import React from 'react';
import { Users } from 'lucide-react';

export const EmptyFriendsState = React.memo(() => {
  return (
    <div className="text-center py-8 md:py-10">
      <div className="w-16 h-16 md:w-18 md:h-18 bg-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Users size={28} className="md:w-9 md:h-9 text-white" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">Niciun prieten adăugat</h3>
      <p className="text-[#9f9f9f] text-sm md:text-base mb-1">Folosește căutarea de mai sus pentru a adăuga jucători.</p>
      <p className="text-[#9f9f9f] text-xs md:text-sm">Adăugarea/ștergerea se confirmă cu parolă.</p>
    </div>
  );
});

EmptyFriendsState.displayName = 'EmptyFriendsState';
