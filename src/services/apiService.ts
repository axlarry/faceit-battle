
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2, // Increased for Discord iframe
  baseDelay: 2000, // Reduced delay for better UX
  maxDelay: 10000
};

export class ApiService {
  private static instance: ApiService;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitDelay: number = 0;
  private isDiscordEnvironment: boolean = false;

  constructor() {
    // Detect Discord environment
    this.isDiscordEnvironment = 
      window.parent !== window || 
      window.location.href.includes('discord.com') ||
      document.referrer.includes('discord.com');
    
    if (this.isDiscordEnvironment) {
      console.log('🎮 API Service initialized in Discord environment');
    }
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async retryRequest<T>(
    requestFn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_RETRY_OPTIONS, ...options };
    
    let lastError: Error;
    
    // Apply rate limit delay if needed
    if (this.rateLimitDelay > 0) {
      console.log(`⏰ Applying rate limit delay: ${this.rateLimitDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      this.rateLimitDelay = Math.max(0, this.rateLimitDelay - 1000);
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn();
        // Reset rate limit delay on success
        this.rateLimitDelay = 0;
        return result;
      } catch (error) {
        lastError = error as Error;
        
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);
        
        // Check if it's a rate limit error
        if (lastError.message.includes('Rate limited') || lastError.message.includes('429')) {
          this.rateLimitDelay = Math.min(this.rateLimitDelay + 3000, 15000);
          console.log(`⏰ Rate limited, increasing delay to: ${this.rateLimitDelay}ms`);
        }
        
        // Special handling for Discord iframe errors
        if (this.isDiscordEnvironment && (
          lastError.message.includes('CORS') || 
          lastError.message.includes('Network') ||
          lastError.message.includes('Failed to fetch')
        )) {
          console.log('🎮 Discord iframe network issue, adjusting retry strategy');
          // Shorter delays in Discord to avoid timeouts
          const discordDelay = Math.min(baseDelay * (attempt + 1), 5000);
          if (attempt < maxRetries) {
            console.log(`🔄 Discord retry ${attempt + 1} after ${discordDelay}ms`);
            await new Promise(resolve => setTimeout(resolve, discordDelay));
            continue;
          }
        }
        
        if (attempt === maxRetries) {
          console.warn(`❌ Request failed after ${maxRetries + 1} attempts in ${this.isDiscordEnvironment ? 'Discord' : 'standalone'} environment`);
          throw lastError;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(1.5, attempt) + Math.random() * 1000,
          maxDelay
        );
        
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Deduplicarea request-urilor identice
    if (this.requestQueue.has(key)) {
      console.log(`♻️ Deduplicating request for key: ${key}`);
      return this.requestQueue.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  clearRequestQueue(): void {
    console.log('🧹 Clearing request queue');
    this.requestQueue.clear();
    this.rateLimitDelay = 0;
  }
}

export const apiService = ApiService.getInstance();
