
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NICK_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const RATE_LIMIT = new Map<string, number>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nickname } = await req.json()

    // Lightweight rate limit per IP
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

    console.log(`Fetching ELO data for: ${nickname}`)
    
    const response = await fetch(`https://faceit.lcrypt.eu/?n=${nickname}`)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Lcrypt API Response:', data)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error fetching lcrypt data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
