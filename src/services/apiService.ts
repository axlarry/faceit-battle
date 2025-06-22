
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 4,
  baseDelay: 1000,
  maxDelay: 8000
};

export class ApiService {
  private static instance: ApiService;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitDelay: number = 0;

  constructor() {
    console.log('🎮 API Service initialized - optimized for Discord compatibility');
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
      this.rateLimitDelay = Math.max(0, this.rateLimitDelay - 500);
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn();
        // Reset rate limit delay on success
        this.rateLimitDelay = 0;
        return result;
      } catch (error) {
        lastError = error as Error;
        
        console.log(`🔄 Discord-optimized retry ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);
        
        // Check if it's a rate limit error
        if (lastError.message.includes('Rate limited') || lastError.message.includes('429')) {
          this.rateLimitDelay = Math.min(this.rateLimitDelay + 2000, 10000);
          console.log(`⏰ Rate limited, increasing delay to: ${this.rateLimitDelay}ms`);
        }
        
        if (attempt === maxRetries) {
          console.warn(`❌ Request failed after ${maxRetries + 1} attempts`);
          throw lastError;
        }
        
        // Exponential backoff with jitter, optimized for Discord
        const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 500, maxDelay);
        
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Deduplication for Edge Function requests
    if (this.requestQueue.has(key)) {
      console.log(`♻️ Deduplicating Edge Function request for key: ${key}`);
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
