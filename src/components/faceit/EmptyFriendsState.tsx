import React from 'react';
import { Users, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/hooks/useAuthSession';

export const EmptyFriendsState = React.memo(() => {
  const { user } = useAuthSession();
  const isLoggedIn = !!user;
  
  return (
    <div className="text-center py-8 md:py-10">
      <div className="w-16 h-16 md:w-18 md:h-18 bg-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Users size={28} className="md:w-9 md:h-9 text-white" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{isLoggedIn ? 'Niciun prieten adăugat' : 'Autentifică-te pentru a-ți vedea prietenii'}</h3>
      <p className="text-[#9f9f9f] text-sm md:text-base mb-4">
        {isLoggedIn ? 'Caută și adaugă prieteni pentru a-i vedea în clasamentul tău personal!' : 'Conectează-te pentru a sincroniza și gestiona lista ta de prieteni.'}
      </p>
      {!isLoggedIn && (
        <Button asChild>
          <a href="/auth" className="inline-flex items-center gap-2">
            <LogIn size={16} /> Mergi la autentificare
          </a>
        </Button>
      )}
    </div>
  );
});

EmptyFriendsState.displayName = 'EmptyFriendsState';
