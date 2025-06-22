
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 1, // Reduced from 3 to 1
  baseDelay: 3000, // Increased from 2000ms to 3000ms
  maxDelay: 15000 // Increased from 10000ms to 15000ms
};

export class ApiService {
  private static instance: ApiService;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitDelay: number = 0; // Track rate limiting

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
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      this.rateLimitDelay = Math.max(0, this.rateLimitDelay - 1000); // Reduce delay over time
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn();
        // Reset rate limit delay on success
        this.rateLimitDelay = 0;
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a rate limit error
        if (lastError.message.includes('Rate limited') || lastError.message.includes('429')) {
          this.rateLimitDelay = Math.min(this.rateLimitDelay + 5000, 30000); // Increase delay up to 30s
        }
        
        if (attempt === maxRetries) {
          console.warn(`Request failed after ${maxRetries} retries`);
          throw lastError;
        }
        
        // Exponential backoff cu delay mai mare
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 3000,
          maxDelay
        );
        
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Deduplicarea request-urilor identice
    if (this.requestQueue.has(key)) {
      console.log(`Deduplicating request for key: ${key}`);
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
