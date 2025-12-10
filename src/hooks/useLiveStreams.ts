
import { useState, useEffect, useCallback, useRef } from 'react';
import { streamingService } from '@/services/streamingService';
import { LiveStream } from '@/types/streaming';
import { Player } from '@/types/Player';

interface UseLiveStreamsProps {
  friends: Player[];
  enabled?: boolean;
  refreshInterval?: number;
}

export const useLiveStreams = ({ 
  friends, 
  enabled = true, 
  refreshInterval = 10000 
}: UseLiveStreamsProps) => {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLiveStreams = useCallback(async () => {
    if (!enabled || friends.length === 0) {
      setLiveStreams([]);
      setIsLoading(false);
      return;
    }

    try {
      const nicknames = friends.map(f => f.nickname);
      const streams = await streamingService.getLiveStreamsForFriends(nicknames);
      setLiveStreams(streams);
      setError(null);
    } catch (err) {
      console.error('Error fetching live streams:', err);
      setError('Failed to fetch live streams');
    } finally {
      setIsLoading(false);
    }
  }, [friends, enabled]);

  useEffect(() => {
    fetchLiveStreams();

    if (enabled && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchLiveStreams, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchLiveStreams, enabled, refreshInterval]);

  const liveCount = liveStreams.filter(s => s.isLive).length;
  const liveStreamsList = liveStreams.filter(s => s.isLive);
  const offlineStreamsList = liveStreams.filter(s => !s.isLive);

  return {
    liveStreams,
    liveStreamsList,
    offlineStreamsList,
    liveCount,
    isLoading,
    error,
    refresh: fetchLiveStreams,
  };
};
