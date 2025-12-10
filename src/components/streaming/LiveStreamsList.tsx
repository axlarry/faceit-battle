
import React from 'react';
import { Radio, WifiOff } from 'lucide-react';
import { LiveStreamCard } from './LiveStreamCard';
import { LiveStream } from '@/types/streaming';
import { Player } from '@/types/Player';

interface LiveStreamsListProps {
  liveStreams: LiveStream[];
  offlineStreams: LiveStream[];
  friends: Player[];
  onWatch: (stream: LiveStream) => void;
}

export const LiveStreamsList = ({ 
  liveStreams, 
  offlineStreams, 
  friends,
  onWatch 
}: LiveStreamsListProps) => {
  const getFriend = (nickname: string) => 
    friends.find(f => f.nickname.toLowerCase() === nickname.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Live Now Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Radio className="text-red-500" size={20} />
          <h2 className="text-lg font-bold text-foreground">
            Live Now
          </h2>
          {liveStreams.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-sm font-bold rounded-full">
              {liveStreams.length}
            </span>
          )}
        </div>

        {liveStreams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveStreams.map((stream) => (
              <LiveStreamCard
                key={stream.nickname}
                stream={stream}
                friend={getFriend(stream.nickname)}
                onWatch={onWatch}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Radio className="text-muted-foreground" size={32} />
            </div>
            <p className="text-muted-foreground text-lg">No friends are streaming right now</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              When a friend starts streaming, they'll appear here
            </p>
          </div>
        )}
      </div>

      {/* Offline Section */}
      {offlineStreams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <WifiOff className="text-muted-foreground" size={18} />
            <h2 className="text-base font-semibold text-muted-foreground">
              Offline ({offlineStreams.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {offlineStreams.map((stream) => (
              <LiveStreamCard
                key={stream.nickname}
                stream={stream}
                friend={getFriend(stream.nickname)}
                onWatch={onWatch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
