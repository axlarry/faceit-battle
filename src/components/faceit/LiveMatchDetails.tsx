
import React from 'react';
import { MapPin } from 'lucide-react';

interface LiveMatchDetailsProps {
  isLive: boolean;
  liveMatchDetails?: any;
}

export const LiveMatchDetails = ({ isLive, liveMatchDetails }: LiveMatchDetailsProps) => {
  if (!isLive || !liveMatchDetails) return null;

  // Format map display with server country
  const getMapDisplay = () => {
    const map = liveMatchDetails.map || 'Hartă Necunoscută';
    const server = liveMatchDetails.server;
    
    if (server) {
      return `${map} (${server})`;
    }
    return map;
  };

  return (
    <div className="mt-1 p-2 bg-gradient-to-r from-green-900/20 via-emerald-900/15 to-green-900/20 rounded-md backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-green-400 flex-shrink-0" />
          <span className="text-green-300 font-medium truncate">
            {getMapDisplay()}
          </span>
        </div>
        {(liveMatchDetails.score || liveMatchDetails.result) && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {liveMatchDetails.score && (
              <div className="bg-gray-800/40 px-2 py-0.5 rounded text-white font-bold text-xs">
                {liveMatchDetails.score}
              </div>
            )}
            {liveMatchDetails.result && (
              <div className={`px-2 py-0.5 rounded font-medium capitalize text-xs ${
                liveMatchDetails.result === 'winning' ? 'text-green-300 bg-green-500/15' : 
                liveMatchDetails.result === 'losing' ? 'text-red-300 bg-red-500/15' : 
                'text-yellow-300 bg-yellow-500/15'
              }`}>
                {liveMatchDetails.result}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
