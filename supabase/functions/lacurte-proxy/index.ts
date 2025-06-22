
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { vanityurl } = await req.json()
    
    if (!vanityurl) {
      throw new Error('Vanity URL is required')
    }

    console.log(`🔍 Lacurte Proxy: Converting vanity URL: ${vanityurl}`)
    
    const response = await fetch(`https://lacurte.ro:3000/api/steamid?vanityurl=${vanityurl}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Discord-Faceit-Tool/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('⚠️ Vanity URL not found');
        return new Response(JSON.stringify({ error: 'Vanity URL not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Lacurte Proxy: Successfully converted ${vanityurl}`);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Lacurte Proxy error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
