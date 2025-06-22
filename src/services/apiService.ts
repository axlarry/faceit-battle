
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 1,
  baseDelay: 2000, // Reduced from 3000ms for better performance
  maxDelay: 10000 // Reduced from 15000ms
};

export class ApiService {
  private static instance: ApiService;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitDelay: number = 0;

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
    
    if (this.rateLimitDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      this.rateLimitDelay = Math.max(0, this.rateLimitDelay - 1000);
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn();
        this.rateLimitDelay = 0;
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (lastError.message.includes('Rate limited') || lastError.message.includes('429')) {
          this.rateLimitDelay = Math.min(this.rateLimitDelay + 3000, 15000); // Optimized rate limiting
        }
        
        if (attempt === maxRetries) {
          console.warn(`Request failed after ${maxRetries} retries`);
          throw lastError;
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(1.5, attempt) + Math.random() * 1000, // Reduced exponential backoff
          maxDelay
        );
        
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  clearRequestQueue(): void {
    this.requestQueue.clear();
    this.rateLimitDelay = 0;
  }
}

export const apiService = ApiService.getInstance();
