
import React from 'react';

interface StreamStatusBadgeProps {
  isLive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StreamStatusBadge = ({ isLive, size = 'md' }: StreamStatusBadgeProps) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (isLive) {
    return (
      <div className={`
        flex items-center gap-1.5 
        bg-red-500/20 border border-red-500/40 
        rounded-full font-bold uppercase tracking-wider
        ${sizeClasses[size]}
      `}>
        <div className={`
          ${dotSizeClasses[size]} 
          bg-red-500 rounded-full 
          animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]
        `} />
        <span className="text-red-400">LIVE</span>
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-1.5 
      bg-muted/30 border border-border/40 
      rounded-full font-medium uppercase tracking-wider
      ${sizeClasses[size]}
    `}>
      <div className={`${dotSizeClasses[size]} bg-muted-foreground/50 rounded-full`} />
      <span className="text-muted-foreground">Offline</span>
    </div>
  );
};
