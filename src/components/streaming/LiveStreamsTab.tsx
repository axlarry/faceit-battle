
import React, { useState } from 'react';
import { RefreshCw, Radio, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveStreamsList } from './LiveStreamsList';
import { LiveStreamPlayer } from './LiveStreamPlayer';
import { RecordingsList } from './RecordingsList';
import { RecordingPlayer } from './RecordingPlayer';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { useRecordings } from '@/hooks/useRecordings';
import { LiveStream, Recording } from '@/types/streaming';
import { Player } from '@/types/Player';

interface LiveStreamsTabProps {
  friends: Player[];
}

export const LiveStreamsTab = ({ friends }: LiveStreamsTabProps) => {
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isRecordingPlayerOpen, setIsRecordingPlayerOpen] = useState(false);

  const { 
    liveStreamsList, 
    offlineStreamsList, 
    liveCount,
    isLoading, 
    refresh 
  } = useLiveStreams({ friends });

  const {
    recordings,
    groupedRecordings,
    isLoading: isLoadingRecordings,
    refresh: refreshRecordings,
  } = useRecordings();

  const handleWatch = (stream: LiveStream) => {
    setSelectedStream(stream);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedStream(null);
  };

  const handlePlayRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setIsRecordingPlayerOpen(true);
  };

  const handleCloseRecordingPlayer = () => {
    setIsRecordingPlayerOpen(false);
    setSelectedRecording(null);
  };

  const handleRefreshAll = () => {
    refresh();
    refreshRecordings();
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
          onClick={handleRefreshAll}
          disabled={isLoading || isLoadingRecordings}
          className="gap-2"
        >
          <RefreshCw size={16} className={(isLoading || isLoadingRecordings) ? 'animate-spin' : ''} />
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
        <div className="space-y-8">
          {/* Live Streams Section */}
          <LiveStreamsList
            liveStreams={liveStreamsList}
            offlineStreams={offlineStreamsList}
            friends={friends}
            onWatch={handleWatch}
          />

          {/* Recordings Section */}
          <div className="border-t border-border pt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <Film className="text-blue-500" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Recent Recordings</h2>
                <p className="text-muted-foreground text-sm">
                  Watch past streams from your friends
                </p>
              </div>
              {recordings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                  {recordings.length}
                </span>
              )}
            </div>

            {isLoadingRecordings ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <RecordingsList
                recordings={recordings}
                groupedRecordings={groupedRecordings}
                friends={friends}
                onPlay={handlePlayRecording}
              />
            )}
          </div>
        </div>
      )}

      {/* Live Stream Player Modal */}
      <LiveStreamPlayer
        stream={selectedStream}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
      />

      {/* Recording Player Modal */}
      <RecordingPlayer
        recording={selectedRecording}
        isOpen={isRecordingPlayerOpen}
        onClose={handleCloseRecordingPlayer}
      />
    </div>
  );
};
