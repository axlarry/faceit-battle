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
const CACHE_TTL_MS = 120000;       // 120 seconds server-side cache
// 8s timeout — 2s buffer before Supabase free plan kills the function at 10s.
// With LcryptQueue(1) on the client (only 1 concurrent request), lcrypt.eu
// should respond in ~1-2s so this limit is rarely hit.
const FETCH_TIMEOUT_MS = 8000;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Global FIFO queue — serialises all lcrypt.eu requests and enforces 2s gap
class GlobalRequestQueue {
  private queue: Array<{
    nickname: string;
    fetchFn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private inProgressNicknames = new Map<string, Promise<any>>();

  async enqueue(nickname: string, fetchFn: () => Promise<any>): Promise<any> {
    if (this.inProgressNicknames.has(nickname)) {
      return this.inProgressNicknames.get(nickname);
    }

    const promise = new Promise((resolve, reject) => {
      this.queue.push({ nickname, fetchFn, resolve, reject });
    });

    this.inProgressNicknames.set(nickname, promise);

    if (!this.processing) {
      this.processQueue();
    }

    return promise;
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const { nickname, fetchFn, resolve, reject } = item;

      try {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        const delay = Math.max(0, MIN_REQUEST_INTERVAL - elapsed);
        if (delay > 0) await new Promise(r => setTimeout(r, delay));

        this.lastRequestTime = Date.now();
        const result = await fetchFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.inProgressNicknames.delete(nickname);
      }
    }

    this.processing = false;
  }
}

const globalQueue = new GlobalRequestQueue();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nickname } = await req.json()

    if (!nickname || !NICK_RE.test(nickname)) {
      throw new Error('Invalid nickname')
    }

    const result = await processLcryptRequest(nickname)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('lcrypt endpoint error:', error)
    return new Response(
      JSON.stringify({ error: error.message, isLive: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processLcryptRequest(nickname: string) {
  try {
    // 1. Check server cache first
    const { data: cached } = await supabase
      .from('lcrypt_cache')
      .select('data, expires_at')
      .eq('nickname', nickname)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      return cached.data
    }

    // 2. Enqueue for rate-limited fetch (single attempt — no retries)
    // Retries are avoided because: a) Supabase free plan kills the function at
    // 10s, leaving no time for retries; b) with LcryptQueue(1) on the client
    // only one request is in flight at a time, so a quick retry would just
    // repeat the same slow condition.
    return await globalQueue.enqueue(nickname, async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      try {
        const response = await fetch(
          `https://faceit.lcrypt.eu/?n=${encodeURIComponent(nickname)}`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'fossabot web proxy',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          const body = await response.text().catch(() => '')
          console.error(`[lcrypt] HTTP ${response.status} for ${nickname}: ${body.slice(0, 200)}`)
          return { error: true, isLive: false, message: `HTTP ${response.status}` }
        }

        const rawText = await response.text()
        let data: any
        try {
          data = JSON.parse(rawText)
        } catch {
          console.error(`[lcrypt] Invalid JSON for ${nickname}`)
          return { error: true, isLive: false, message: 'Invalid JSON' }
        }

        // 3. Cache the successful response
        try {
          await supabase.from('lcrypt_cache').delete().eq('nickname', nickname)
          await supabase.from('lcrypt_cache').insert({
            nickname,
            data,
            expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
          })
        } catch (cacheError) {
          console.error(`[lcrypt] Cache write failed for ${nickname}:`, cacheError)
        }

        return data

      } catch (error) {
        clearTimeout(timeoutId)
        const msg = (error as Error).message || 'Fetch failed'
        console.error(`[lcrypt] Fetch failed for ${nickname}: ${msg}`)
        return { error: true, isLive: false, message: msg }
      }
    })

  } catch (error) {
    console.error(`[lcrypt] Fatal error for ${nickname}:`, error)
    return { error: true, isLive: false, message: error.message }
  }
}
