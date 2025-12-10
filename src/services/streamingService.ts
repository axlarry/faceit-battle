
import { StreamsResponse, LiveStream } from '@/types/streaming';

const STREAM_API_BASE = 'https://faceit.lacurte.ro/stream-api';
const HLS_BASE = 'https://faceit.lacurte.ro/hls';

class StreamingService {
  private cachedStreams: Map<string, boolean> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  async getActiveStreams(): Promise<Record<string, boolean>> {
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
      
      if (data.items) {
        Object.entries(data.items).forEach(([path, info]) => {
          // Extract stream name from path (e.g., "live/Lacurte" -> "Lacurte")
          const streamName = path.replace('live/', '');
          if (info.ready) {
            this.cachedStreams.set(streamName.toLowerCase(), true);
          }
        });
      }

      this.lastFetch = now;
      return Object.fromEntries(this.cachedStreams);
    } catch (error) {
      console.error('Error fetching active streams:', error);
      return Object.fromEntries(this.cachedStreams);
    }
  }

  async checkStreamStatus(nickname: string): Promise<boolean> {
    const activeStreams = await this.getActiveStreams();
    return activeStreams[nickname.toLowerCase()] ?? false;
  }

  getStreamUrl(nickname: string): string {
    return `${HLS_BASE}/live/${nickname}/index.m3u8`;
  }

  async getLiveStreamsForFriends(nicknames: string[]): Promise<LiveStream[]> {
    const activeStreams = await this.getActiveStreams();
    
    return nicknames.map(nickname => ({
      nickname,
      isLive: activeStreams[nickname.toLowerCase()] ?? false,
      streamUrl: this.getStreamUrl(nickname),
    }));
  }
}

export const streamingService = new StreamingService();
