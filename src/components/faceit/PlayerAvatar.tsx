import React, { memo, useCallback, useMemo } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { getProxiedAvatarUrl } from '@/lib/discordProxy';

interface PlayerAvatarProps {
  avatar: string;
  nickname: string;
  index: number;
  isLive: boolean;
}

const FALLBACK_AVATAR = '/faceit-icons/faceit_icon.png';

export const PlayerAvatar = memo(({ avatar, nickname, index, isLive }: PlayerAvatarProps) => {
  const safeAvatar = useMemo(() => {
    const rawAvatar = avatar && avatar.trim() ? avatar : FALLBACK_AVATAR;
    return getProxiedAvatarUrl(rawAvatar);
  }, [avatar]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_AVATAR;
  }, []);

  const rankDisplay = useMemo(() => {
    if (index === 0) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <Crown className="w-6 h-6 text-yellow-400" />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">1</span>
          </div>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="flex flex-col items-center justify-center">
          <Trophy className="w-5 h-5 text-gray-300" />
          <span className="text-xs font-bold">#2</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="flex flex-col items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-bold">#3</span>
        </div>
      );
    }
    return <>#{index + 1}</>;
  }, [index]);

  const rankColor = useMemo(() => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-300';
    if (index === 2) return 'text-amber-600';
    return 'text-primary';
  }, [index]);

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`text-lg font-bold min-w-[2rem] text-center relative ${rankColor}`}>
        {rankDisplay}
      </div>
      <div className="relative">
        <img
          src={safeAvatar}
          alt={nickname}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className={`w-16 h-16 rounded-lg border-2 shadow-lg flex-shrink-0 transition-all duration-200 ${
            isLive 
              ? 'border-green-400 ring-2 ring-green-500/50' 
              : 'border-primary'
          }`}
        />
        {isLive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-foreground">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
          </div>
        )}
      </div>
    </div>
  );
});

PlayerAvatar.displayName = 'PlayerAvatar';
