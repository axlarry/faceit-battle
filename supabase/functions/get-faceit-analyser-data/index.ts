import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FaceitAnalyserRequest {
  nickname: string;
  endpoint?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nickname, endpoint = 'stats' }: FaceitAnalyserRequest = await req.json()
    
    if (!nickname) {
      throw new Error('Nickname is required')
    }

    console.log(`Fetching FaceitAnalyser ${endpoint} data for: ${nickname}`)

    // Make request to FaceitAnalyser API
    const apiKey = Deno.env.get('FACEIT_ANALYSER_API_KEY')
    if (!apiKey) {
      throw new Error('FACEIT_ANALYSER_API_KEY not configured')
    }

    const faceitAnalyserUrl = `https://faceitanalyser.com/api/${endpoint}/${encodeURIComponent(nickname)}?key=${encodeURIComponent(apiKey)}`
    
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