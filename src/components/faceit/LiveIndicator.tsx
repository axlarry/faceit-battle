
import React from 'react';

interface LiveIndicatorProps {
  isLive: boolean;
}

export const LiveIndicator = ({ isLive }: LiveIndicatorProps) => {
  if (!isLive) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full backdrop-blur-sm">
      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
      <span className="text-xs text-green-400 font-medium">LIVE</span>
    </div>
  );
};
