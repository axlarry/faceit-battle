import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Edge Function called: get-faceit-analyser-data');
    const { playerId, dataType } = await req.json()
    console.log('📥 Request data:', { playerId, dataType });
    
    if (!playerId || !dataType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: playerId and dataType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const faceitAnalyserApiKey = Deno.env.get('FACEIT_ANALYSER_API_KEY')
    if (!faceitAnalyserApiKey) {
      return new Response(
        JSON.stringify({ error: 'Faceit Analyser API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let apiUrl = ''
    switch (dataType) {
      case 'player_stats':
        apiUrl = `https://api.faceitanalyser.com/api/player/${playerId}/stats`
        break
      case 'player_graphs':
        apiUrl = `https://api.faceitanalyser.com/api/player/${playerId}/graphs`
        break
      case 'match_analysis':
        apiUrl = `https://api.faceitanalyser.com/api/match/${playerId}/analysis`
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid dataType. Must be: player_stats, player_graphs, or match_analysis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${faceitAnalyserApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Faceit Analyser API error: ${response.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch data from Faceit Analyser API',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({ data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})