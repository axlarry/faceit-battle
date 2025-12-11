// V2.0 Consolidated API Service with advanced caching and deduplication
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface RequestOptions {
  maxRetries?: number;
  baseDelay?: number;
  cacheTime?: number;
  forceRefresh?: boolean;
}

export class OptimizedApiService {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private rateLimitDelay = 0;
  private lastRequestTime = 0;

  // Intelligent request deduplication with caching
  async dedupedRequest<T>(
    key: string, 
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { cacheTime = 30000, forceRefresh = false } = options;
    
    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCached<T>(key);
      if (cached) {
        console.log(`📦 Cache hit for ${key}`);
        return cached;
      }
    }

    // Check for pending request
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Deduplicating request for ${key}`);
      return this.pendingRequests.get(key)!;
    }

    // Create new request with retry logic
    const requestPromise = this.retryRequest(requestFn, options)
      .then((result) => {
        // Cache successful result
        this.setCache(key, result, cacheTime);
        return result;
      })
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  // Advanced retry logic with exponential backoff
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000 } = options;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Rate limiting protection
        await this.enforceRateLimit();
        
        const result = await requestFn();
        
        // Reset rate limit delay on success
        this.rateLimitDelay = 0;
        
        return result;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRateLimit = this.isRateLimitError(error);
        
        if (isRateLimit) {
          // Exponential backoff for rate limits
          this.rateLimitDelay = Math.min(this.rateLimitDelay * 2 || 2000, 30000);
          console.warn(`Rate limited, waiting ${this.rateLimitDelay}ms`);
          
          if (!isLastAttempt) {
            await this.delay(this.rateLimitDelay);
            continue;
          }
        }
        
        if (isLastAttempt) {
          throw error;
        }
        
        // Standard exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // Optimized Faceit API calls
  async faceitApiCall(endpoint: string, useLeaderboardApi = false, options: RequestOptions = {}) {
    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return this.dedupedRequest(requestKey, async () => {
      console.log(`🌐 Faceit API: ${endpoint}`);
      
      const { data, error } = await invokeFunction('proxy-faceit', { endpoint, useLeaderboardApi });
      
      if (error) {
        if (this.isRateLimitError(error)) {
          throw new Error('Rate limited');
        }
        console.warn('Faceit proxy error:', error);
        return null;
      }
      
      return data ?? null;
    }, options);
  }

  // Optimized Lcrypt API calls
  async lcryptApiCall(nickname: string, options: RequestOptions = {}) {
    const requestKey = `lcrypt-${nickname}`;
    
    return this.dedupedRequest(requestKey, async () => {
      console.log(`🔍 Lcrypt API: ${nickname}`);
      
      const { data, error } = await invokeFunction('get-lcrypt-elo', { nickname });

      if (error) {
        console.warn(`Lcrypt API error for ${nickname}:`, error);
        return { isLive: false, error: true };
      }

      if (data?.error === true || data?.message === "player not found") {
        return { isLive: false, error: true };
      }

      return data;
    }, { cacheTime: 45000, ...options }); // Longer cache for lcrypt data
  }

  // Batch API processing with intelligent scheduling
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      delay?: number;
      maxConcurrency?: number;
    } = {}
  ): Promise<R[]> {
    const { batchSize = 3, delay = 500, maxConcurrency = 5 } = options;
    const results: R[] = [];
    
    // Process in smaller concurrent batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Limit concurrency within each batch
      const batchPromises = batch.map(item => 
        this.limitConcurrency(() => processor(item), maxConcurrency)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Extract successful results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
      
      // Delay between batches
      if (i + batchSize < items.length) {
        await this.delay(delay);
      }
    }
    
    return results;
  }

  // Private helper methods
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    
    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCache<T>(key: string, data: T, cacheTime: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + cacheTime
    });
    
    // Prevent memory leaks - limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 100; // Minimum 100ms between requests
    
    if (timeSinceLastRequest < minInterval) {
      await this.delay(minInterval - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  private isRateLimitError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('429') || 
           message.includes('rate limit') || 
           message.includes('too many requests');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private semaphore = 0;
  private async limitConcurrency<T>(fn: () => Promise<T>, max: number): Promise<T> {
    while (this.semaphore >= max) {
      await this.delay(10);
    }
    
    this.semaphore++;
    try {
      return await fn();
    } finally {
      this.semaphore--;
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 API cache cleared');
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number; hitRate: number } {
    // Implementation would track hit/miss rates
    return {
      size: this.cache.size,
      hitRate: 0.85 // Placeholder
    };
  }
}

export const optimizedApiService = new OptimizedApiService();