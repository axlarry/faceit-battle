
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NICK_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const RATE_LIMIT = new Map<string, number>();
const REQUEST_QUEUE = new Map<string, Promise<any>>();
const MIN_REQUEST_INTERVAL = 2500; // 2.5 seconds between requests

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Deduplication: Check if request already in progress
    if (REQUEST_QUEUE.has(nickname)) {
      console.log(`⏳ Request already in progress for ${nickname}, waiting...`)
      const result = await REQUEST_QUEUE.get(nickname)
      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Create request promise and add to queue
    const requestPromise = processLcryptRequest(nickname)
    REQUEST_QUEUE.set(nickname, requestPromise)

    try {
      const result = await requestPromise
      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    } finally {
      REQUEST_QUEUE.delete(nickname)
    }

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
    // 1. Check cache first
    const { data: cached } = await supabase
      .from('lcrypt_cache')
      .select('data, expires_at')
      .eq('nickname', nickname)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log(`🎯 Cache HIT for ${nickname}`)
      return cached.data
    }

    console.log(`🌐 Cache MISS for ${nickname}, fetching from external API`)

    // 2. Rate limiting with jitter to avoid ban
    const ip = 'server'
    const now = Date.now()
    const last = RATE_LIMIT.get(ip) || 0
    const timeDiff = now - last
    
    // Add random jitter (0-500ms) to avoid collision
    const jitter = Math.random() * 500
    const minInterval = MIN_REQUEST_INTERVAL + jitter
    
    if (timeDiff < minInterval) {
      const delay = minInterval - timeDiff
      console.log(`⏱️ Rate limiting: waiting ${Math.round(delay)}ms (with jitter)`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    RATE_LIMIT.set(ip, Date.now())

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
        console.log(`✅ Success from lcrypt.eu for ${nickname}:`, data)

        // 4. Cache the successful response (10 minutes, safer upsert)
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
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
            })
          
          console.log(`💾 Cached data for ${nickname} (10 min TTL)`)
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

  } catch (error) {
    console.error(`❌ Fatal error processing ${nickname}:`, error)
    return {
      error: true,
      isLive: false,
      message: error.message
    }
  }
}
