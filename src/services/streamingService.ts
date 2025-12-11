
import { StreamsResponse, LiveStream } from '@/types/streaming';

const STREAM_API_BASE = 'https://faceit.lacurte.ro/stream-api';
const HLS_BASE = 'https://faceit.lacurte.ro/hls';

class StreamingService {
  // Key: lowercase nickname, Value: original stream name (preserves case)
  private cachedStreams: Map<string, string> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  async getActiveStreams(): Promise<Record<string, string>> {
    const now = Date.now();
    
    // Return cached data if fresh
    if (now - this.lastFetch < this.CACHE_DURATION && this.cachedStreams.size > 0) {
      return Object.fromEntries(this.cachedStreams);
    }

    try {
      const response = await fetch(`${STREAM_API_BASE}/v3/paths/list`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch active streams:', response.status);
        return Object.fromEntries(this.cachedStreams);
      }

      const data: StreamsResponse = await response.json();

      this.cachedStreams.clear();
      
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          // Extract stream name from path (e.g., "live/Suzeta" -> "Suzeta")
          if (item.name.startsWith('live/') && item.ready) {
            const streamName = item.name.replace('live/', '');
            // Store: key=lowercase, value=original name (preserves case for HLS URL)
            this.cachedStreams.set(streamName.toLowerCase(), streamName);
          }
        });
      }
      
      console.log('Active streams found:', Object.fromEntries(this.cachedStreams));

      this.lastFetch = now;
      return Object.fromEntries(this.cachedStreams);
    } catch (error) {
      console.error('Error fetching active streams:', error);
      return Object.fromEntries(this.cachedStreams);
    }
  }

  async checkStreamStatus(nickname: string): Promise<boolean> {
    const activeStreams = await this.getActiveStreams();
    return !!activeStreams[nickname.toLowerCase()];
  }

  getStreamUrl(nickname: string): string {
    // Use original case from cache if available, otherwise use provided nickname
    const originalName = this.cachedStreams.get(nickname.toLowerCase());
    return `${HLS_BASE}/live/${originalName || nickname}/index.m3u8`;
  }

  async getLiveStreamsForFriends(nicknames: string[]): Promise<LiveStream[]> {
    const activeStreams = await this.getActiveStreams();
    
    return nicknames.map(nickname => {
      const originalName = activeStreams[nickname.toLowerCase()];
      const isLive = !!originalName;
      
      return {
        nickname,
        isLive,
        // Use original case-preserved name from MediaMTX for HLS URL
        streamUrl: isLive ? `${HLS_BASE}/live/${originalName}/index.m3u8` : undefined,
      };
    });
  }
}

export const streamingService = new StreamingService();
