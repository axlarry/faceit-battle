
import { Recording, RecordingsApiResponse } from '@/types/streaming';
import { getLacurteBaseUrl, isDiscordActivity } from '@/lib/discordProxy';

class RecordingsService {
  private cache: Recording[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private getRecordingsApiUrl(): string {
    return `${getLacurteBaseUrl()}/recordings.php`;
  }

  async getAllRecordings(): Promise<Recording[]> {
    const now = Date.now();
    
    if (now - this.lastFetch < this.CACHE_DURATION && this.cache.length > 0) {
      return this.cache;
    }

    const apiUrl = this.getRecordingsApiUrl();
    
    console.log('📹 Fetching recordings:', {
      url: apiUrl,
      isDiscord: isDiscordActivity()
    });

    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.warn('Failed to fetch recordings:', response.status);
        return this.cache;
      }

      const data: RecordingsApiResponse = await response.json();
      
      // Build recording URLs using the correct base
      const baseUrl = getLacurteBaseUrl();
      
      this.cache = data.recordings.map((rec, index) => ({
        id: `${rec.nickname}-${rec.date}-${index}`,
        nickname: rec.nickname,
        filename: rec.filename,
        // Update URL to use proxy if in Discord
        url: isDiscordActivity() 
          ? rec.url.replace('https://faceit.lacurte.ro', baseUrl)
          : rec.url,
        date: new Date(rec.date * 1000),
        size: rec.size,
      }));

      this.lastFetch = now;
      console.log('✅ Recordings fetched:', this.cache.length);
      return this.cache;
    } catch (error) {
      console.error('❌ Error fetching recordings:', error);
      return this.cache;
    }
  }

  async getRecordingsForUser(nickname: string): Promise<Recording[]> {
    const all = await this.getAllRecordings();
    return all.filter(rec => rec.nickname.toLowerCase() === nickname.toLowerCase());
  }

  getRecordingsGroupedByUser(recordings: Recording[]): Record<string, Recording[]> {
    return recordings.reduce((acc, rec) => {
      if (!acc[rec.nickname]) {
        acc[rec.nickname] = [];
      }
      acc[rec.nickname].push(rec);
      return acc;
    }, {} as Record<string, Recording[]>);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  clearCache() {
    this.cache = [];
    this.lastFetch = 0;
  }
}

export const recordingsService = new RecordingsService();
