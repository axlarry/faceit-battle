import React, { memo, useCallback, useMemo } from 'react';

interface PlayerActionsCompactProps {
  nickname: string;
  steamId64: string | null;
  isLive: boolean;
  onLinkClick: (e: React.MouseEvent) => void;
}

const ActionLink = memo(({ 
  href, 
  iconSrc, 
  alt, 
  isLive, 
  hoverColor 
}: { 
  href: string; 
  iconSrc: string; 
  alt: string; 
  isLive: boolean; 
  hoverColor: string;
}) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  }, []);

  const baseClasses = "bg-transparent border-0 text-xs transition-all duration-200 rounded-lg w-9 h-9 flex items-center justify-center";
  const liveClasses = isLive 
    ? 'text-orange-400 hover:border hover:border-orange-400 hover:bg-orange-400 hover:text-foreground shadow-orange-400/20 shadow-md'
    : hoverColor;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${liveClasses}`}
    >
      <img 
        src={iconSrc} 
        alt={alt} 
        className="w-7 h-7"
        loading="lazy"
        decoding="async"
        onError={handleImageError}
      />
    </a>
  );
});

ActionLink.displayName = 'ActionLink';

export const PlayerActionsCompact = memo(({ nickname, steamId64, isLive, onLinkClick }: PlayerActionsCompactProps) => {
  const steamUrl = useMemo(() => {
    return steamId64 
      ? `https://steamcommunity.com/profiles/${steamId64}` 
      : `https://steamcommunity.com/search/users/#text=${nickname}`;
  }, [steamId64, nickname]);

  return (
    <div className="flex gap-1" onClick={onLinkClick}>
      <ActionLink
        href={`https://www.faceit.com/en/players/${nickname}`}
        iconSrc="/faceit-icons/faceit_icon.png"
        alt="FACEIT"
        isLive={isLive}
        hoverColor="text-primary hover:border hover:border-primary hover:bg-primary hover:text-primary-foreground"
      />
      <ActionLink
        href={steamUrl}
        iconSrc="/faceit-icons/steam_icon.png"
        alt="Steam"
        isLive={isLive}
        hoverColor="text-blue-400 hover:border hover:border-blue-400 hover:bg-blue-500 hover:text-foreground"
      />
    </div>
  );
});

PlayerActionsCompact.displayName = 'PlayerActionsCompact';
