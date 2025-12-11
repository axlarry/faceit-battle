import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-discord-locale, x-discord-activity-storage-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const NICK_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests to lcrypt.eu

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Global FIFO Queue for lcrypt.eu API calls
class GlobalRequestQueue {
  private queue: Array<{
    nickname: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
  }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private inProgressNicknames = new Map<string, Promise<any>>();

  async enqueue(nickname: string, fetchFn: () => Promise<any>): Promise<any> {
    // Check if already processing this nickname
    if (this.inProgressNicknames.has(nickname)) {
      console.log(`⏳ Request for ${nickname} already in progress, waiting for result...`);
      return this.inProgressNicknames.get(nickname);
    }

    // Create promise for this request
    const promise = new Promise((resolve, reject) => {
      const queueItem = {
        nickname,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      this.queue.push(queueItem);
      console.log(`📥 Added ${nickname} to queue (position: ${this.queue.length}/${this.queue.length})`);
    });

    // Store in-progress promise
    this.inProgressNicknames.set(nickname, promise);

    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue(fetchFn);
    }

    return promise;
  }

  private async processQueue(fetchFn: () => Promise<any>) {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const { nickname, resolve, reject } = item;

      try {
        // Calculate delay to enforce 2 second interval
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const delay = Math.max(0, MIN_REQUEST_INTERVAL - timeSinceLastRequest);

        if (delay > 0) {
          console.log(`⏱️ Rate limiting: waiting ${delay}ms before processing ${nickname} (queue: ${this.queue.length + 1} items)`);
          await new Promise(r => setTimeout(r, delay));
        }

        console.log(`🚀 Processing from queue: ${nickname} (remaining in queue: ${this.queue.length})`);
        
        // Update last request time
        this.lastRequestTime = Date.now();

        // Execute the actual fetch
        const result = await fetchFn();
        
        console.log(`✅ Queue processed: ${nickname} (queue now: ${this.queue.length} items)`);
        
        // Resolve the promise
        resolve(result);
        
        // Remove from in-progress
        this.inProgressNicknames.delete(nickname);

      } catch (error) {
        console.error(`❌ Queue processing failed for ${nickname}:`, error);
        reject(error);
        this.inProgressNicknames.delete(nickname);
      }
    }

    this.processing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

// Global queue instance
const globalQueue = new GlobalRequestQueue();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nickname } = await req.json()
    
    if (!nickname || !NICK_RE.test(nickname)) {
      throw new Error('Invalid nickname')
    }

    console.log(`📋 Processing ELO request for: ${nickname}`)

    const result = await processLcryptRequest(nickname)
    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('❌ Error in lcrypt endpoint:', error)
    return new Response(
      JSON.stringify({ error: error.message, isLive: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processLcryptRequest(nickname: string) {
  try {
    // 1. Check cache first (bypass queue if cached)
    const { data: cached } = await supabase
      .from('lcrypt_cache')
      .select('data, expires_at')
      .eq('nickname', nickname)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log(`🎯 Cache HIT for ${nickname} - bypassing queue`)
      
      // Log LIVE status from cache
      if (cached.data?.current?.present === true) {
        console.log(`🟢 CACHED LIVE: ${nickname} - ${cached.data.current.status}, Map: ${cached.data.current.map}`)
      }
      
      return cached.data
    }

    console.log(`🌐 Cache MISS for ${nickname}, adding to queue`)

    // 2. Add to global queue for rate-limited processing
    return await globalQueue.enqueue(nickname, async () => {
      console.log(`🔄 Executing fetch for ${nickname} from lcrypt.eu`)

      // 3. Make external API call with retry logic
      let lastError: Error | null = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🚀 Attempt ${attempt} - Fetching from lcrypt.eu for: ${nickname}`)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
          
          const response = await fetch(`https://faceit.lcrypt.eu/?n=${nickname}`, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Faceit-Tool/1.0',
            }
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          console.log(`✅ Success from lcrypt.eu for ${nickname}`)

          // 4. Cache the successful response (30 seconds for LIVE detection)
          try {
            // Delete old entry first to avoid conflicts
            await supabase
              .from('lcrypt_cache')
              .delete()
              .eq('nickname', nickname)
            
            // Insert new entry
            await supabase
              .from('lcrypt_cache')
              .insert({ 
                nickname, 
                data,
                expires_at: new Date(Date.now() + 30 * 1000).toISOString() // 30 seconds
              })
            
            console.log(`💾 Cached data for ${nickname} (30s TTL for LIVE detection)`)
            
            // Log LIVE status detection
            if (data?.current?.present === true) {
              console.log(`🟢 LIVE PLAYER CACHED: ${nickname} - Status: ${data.current.status}, Map: ${data.current.map}, Playing: ${data.playing}`)
            } else {
              console.log(`⚪ NOT LIVE: ${nickname} - present: ${data.current?.present}, playing: ${data.playing}`)
            }
          } catch (cacheError) {
            console.error(`⚠️ Cache write failed for ${nickname}:`, cacheError)
            // Continue anyway, we have the data
          }

          return data

        } catch (error) {
          lastError = error as Error
          const errorMsg = error.message || String(error)
          console.error(`❌ Attempt ${attempt} failed for ${nickname}:`, errorMsg)
          
          if (attempt < 3) {
            // Longer delay for rate limit errors (15 seconds), shorter for others
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate limit')
            const delay = isRateLimit ? 15000 : (attempt * 3000) // 15s for rate limit, 3s/6s for others
            console.log(`⏳ Retrying in ${delay}ms... (${isRateLimit ? 'rate limit detected' : 'network error'})`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      // All attempts failed, return error response
      console.error(`💀 All attempts failed for ${nickname}`)
      return {
        error: true,
        isLive: false,
        message: lastError?.message || 'Failed to fetch data'
      }
    })

  } catch (error) {
    console.error(`❌ Fatal error processing ${nickname}:`, error)
    return {
      error: true,
      isLive: false,
      message: error.message
    }
  }
}
