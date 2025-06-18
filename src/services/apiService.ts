
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

export class ApiService {
  private static instance: ApiService;
  private requestQueue: Map<string, Promise<any>> = new Map();

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
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff cu jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms for request`);
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
  }
}

export const apiService = ApiService.getInstance();
