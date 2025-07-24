import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const FACEIT_ANALYSER_API_KEY = 'B9uwGBLLjCAoBrLJYph4TKvU2Doziue6Yq8svfvG';
const FACEIT_ANALYSER_BASE_URL = 'https://faceitanalyser.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, playerId, filters } = await req.json()
    
    if (!endpoint || !playerId) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or playerId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the URL
    let url = `${FACEIT_ANALYSER_BASE_URL}/api/${endpoint}/${playerId}`;
    
    // Add filters as query parameters if provided
    if (filters && Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, value as string);
      });
      url += `?${params.toString()}`;
    }

    console.log('Making FaceitAnalyser API call to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FACEIT_ANALYSER_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FaceitTool/1.0'
      },
    });

    if (!response.ok) {
      console.error('FaceitAnalyser API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `API call failed: ${response.status} ${response.statusText}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json();
    console.log('FaceitAnalyser API response:', data);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-faceit-analyser-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})