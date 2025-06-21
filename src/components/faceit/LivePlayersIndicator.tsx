
import React from 'react';
import { Users } from 'lucide-react';

interface LivePlayersIndicatorProps {
  livePlayersCount: number;
}

export const LivePlayersIndicator = React.memo(({ livePlayersCount }: LivePlayersIndicatorProps) => {
  if (livePlayersCount === 0) {
    return null;
  }
  
  return (
    <div 
      className="text-green-500 font-bold text-base flex items-center gap-1" 
      style={{
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <Users size={16} className="text-green-500" />
      <span>{livePlayersCount} LIVE</span>
    </div>
  );
});

LivePlayersIndicator.displayName = 'LivePlayersIndicator';
