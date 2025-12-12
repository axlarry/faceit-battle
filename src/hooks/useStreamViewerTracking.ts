import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ViewerState {
  viewerId: string;
  joinedAt: string;
}

// Generate a unique viewer ID for this session
const getViewerId = (): string => {
  let viewerId = sessionStorage.getItem('stream_viewer_id');
  if (!viewerId) {
    viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('stream_viewer_id', viewerId);
  }
  return viewerId;
};

export const useStreamViewerTracking = (streamName: string | null, isWatching: boolean = false) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const viewerId = useRef(getViewerId());

  useEffect(() => {
    if (!streamName || !isWatching) {
      // Clean up if not watching
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      return;
    }

    const channelName = `stream_viewers:${streamName.toLowerCase()}`;
    
    // Create presence channel for this stream
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: viewerId.current,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this viewer's presence
        await channel.track({
          viewerId: viewerId.current,
          joinedAt: new Date().toISOString(),
        } as ViewerState);
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [streamName, isWatching]);
};

export const useStreamViewerCount = (streamName: string | null) => {
  const [viewerCount, setViewerCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!streamName) {
      setViewerCount(0);
      return;
    }

    const channelName = `stream_viewers:${streamName.toLowerCase()}`;
    
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [streamName]);

  return viewerCount;
};

// Hook to get viewer counts for multiple streams at once
export const useMultipleStreamViewerCounts = (streamNames: string[]) => {
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  useEffect(() => {
    // Clean up old channels that are no longer needed
    const currentNames = new Set(streamNames.map(n => n.toLowerCase()));
    
    channelsRef.current.forEach((channel, name) => {
      if (!currentNames.has(name)) {
        channel.unsubscribe();
        channelsRef.current.delete(name);
      }
    });

    // Subscribe to new streams
    streamNames.forEach((streamName) => {
      const normalizedName = streamName.toLowerCase();
      
      if (channelsRef.current.has(normalizedName)) {
        return; // Already subscribed
      }

      const channelName = `stream_viewers:${normalizedName}`;
      const channel = supabase.channel(channelName);

      const updateCount = () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCounts(prev => ({ ...prev, [normalizedName]: count }));
      };

      channel
        .on('presence', { event: 'sync' }, updateCount)
        .on('presence', { event: 'join' }, updateCount)
        .on('presence', { event: 'leave' }, updateCount)
        .subscribe();

      channelsRef.current.set(normalizedName, channel);
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        channel.unsubscribe();
      });
      channelsRef.current.clear();
    };
  }, [streamNames.join(',')]);

  return viewerCounts;
};
