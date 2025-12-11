
import { StreamsResponse, LiveStream } from '@/types/streaming';
import { getLacurteBaseUrl, isDiscordActivity } from '@/lib/discordProxy';

interface StreamData {
  originalName: string;
  viewers: number;
}

class StreamingService {
  // Key: lowercase nickname, Value: stream data with original name and viewers
  private cachedStreams: Map<string, StreamData> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  private getStreamApiBase(): string {
    return `${getLacurteBaseUrl()}/stream-api`;
  }

  private getHlsBase(): string {
    return `${getLacurteBaseUrl()}/hls`;
  }

  async getActiveStreams(): Promise<Record<string, StreamData>> {
    const now = Date.now();
    
    // Return cached data if fresh
    if (now - this.lastFetch < this.CACHE_DURATION && this.cachedStreams.size > 0) {
      return Object.fromEntries(this.cachedStreams);
    }

    const apiUrl = `${this.getStreamApiBase()}/v3/paths/list`;
    
    console.log('📺 Fetching active streams:', {
      url: apiUrl,
      isDiscord: isDiscordActivity()
    });

    try {
      const response = await fetch(apiUrl, {
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
            // Store: key=lowercase, value=StreamData with original name and viewer count
            this.cachedStreams.set(streamName.toLowerCase(), {
              originalName: streamName,
              viewers: item.readers?.length || 0,
            });
          }
        });
      }
      
      console.log('✅ Active streams found:', Object.fromEntries(this.cachedStreams));

      this.lastFetch = now;
      return Object.fromEntries(this.cachedStreams);
    } catch (error) {
      console.error('❌ Error fetching active streams:', error);
      return Object.fromEntries(this.cachedStreams);
    }
  }

  async checkStreamStatus(nickname: string): Promise<boolean> {
    const activeStreams = await this.getActiveStreams();
    return !!activeStreams[nickname.toLowerCase()];
  }

  getStreamUrl(nickname: string): string {
    // Use original case from cache if available, otherwise use provided nickname
    const streamData = this.cachedStreams.get(nickname.toLowerCase());
    return `${this.getHlsBase()}/live/${streamData?.originalName || nickname}/index.m3u8`;
  }

  async getLiveStreamsForFriends(nicknames: string[]): Promise<LiveStream[]> {
    const activeStreams = await this.getActiveStreams();
    const hlsBase = this.getHlsBase();
    
    return nicknames.map(nickname => {
      const streamData = activeStreams[nickname.toLowerCase()];
      const isLive = !!streamData;
      
      return {
        nickname,
        isLive,
        streamUrl: isLive ? `${hlsBase}/live/${streamData.originalName}/index.m3u8` : undefined,
        viewers: streamData?.viewers || 0,
      };
    });
  }
}

export const streamingService = new StreamingService();
