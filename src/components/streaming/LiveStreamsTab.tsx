
import React, { useState } from 'react';
import { RefreshCw, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveStreamsList } from './LiveStreamsList';
import { LiveStreamPlayer } from './LiveStreamPlayer';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { LiveStream } from '@/types/streaming';
import { Player } from '@/types/Player';

interface LiveStreamsTabProps {
  friends: Player[];
}

export const LiveStreamsTab = ({ friends }: LiveStreamsTabProps) => {
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const { 
    liveStreamsList, 
    offlineStreamsList, 
    liveCount,
    isLoading, 
    refresh 
  } = useLiveStreams({ friends });

  const handleWatch = (stream: LiveStream) => {
    setSelectedStream(stream);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedStream(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <Radio className="text-red-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Streams</h1>
            <p className="text-muted-foreground text-sm">
              Watch your friends play live
            </p>
          </div>
          {liveCount > 0 && (
            <div className="ml-2 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
              {liveCount} LIVE
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading && friends.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading streams...</span>
          </div>
        </div>
      ) : friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Radio className="text-muted-foreground" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Friends Added</h2>
          <p className="text-muted-foreground max-w-md">
            Add friends to your list to see when they're streaming live. 
            Go to "Prietenii Mei" tab to add friends.
          </p>
        </div>
      ) : (
        <LiveStreamsList
          liveStreams={liveStreamsList}
          offlineStreams={offlineStreamsList}
          friends={friends}
          onWatch={handleWatch}
        />
      )}

      {/* Player Modal */}
      <LiveStreamPlayer
        stream={selectedStream}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
      />
    </div>
  );
};
