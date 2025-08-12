import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FaceitAnalyserRequest {
  nickname: string;
  endpoint?: string;
}

const ENDPOINT_ALLOWLIST = new Set(['stats','overview','matches','hubs','maps','names','highlights','playerGraphs']);
const NICK_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const RATE_LIMIT = new Map<string, number>();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nickname, endpoint = 'stats' }: FaceitAnalyserRequest = await req.json()

    // Basic rate limiting per IP (very lightweight)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const last = RATE_LIMIT.get(ip) || 0
    if (now - last < 300) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    RATE_LIMIT.set(ip, now)
    
    if (!nickname || !NICK_RE.test(nickname)) {
      throw new Error('Invalid nickname')
    }

    if (!ENDPOINT_ALLOWLIST.has(endpoint)) {
      throw new Error('Endpoint not allowed')
    }

    console.log(`Fetching FaceitAnalyser ${endpoint} data for: ${nickname}`)

    const analyserKey = Deno.env.get('FACEIT_ANALYSER_API_KEY')
    if (!analyserKey) {
      throw new Error('FACEIT_ANALYSER_API_KEY not configured')
    }

    const faceitAnalyserUrl = `https://faceitanalyser.com/api/${endpoint}/${encodeURIComponent(nickname)}?key=${analyserKey}`
    
    const response = await fetch(faceitAnalyserUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`FaceitAnalyser API error: ${response.status} ${response.statusText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('FaceitAnalyser response:', data)

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in get-faceit-analyser-data function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch FaceitAnalyser data',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})