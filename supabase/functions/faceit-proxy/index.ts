
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FACEIT_CONFIG = {
  API_BASE: 'https://open.faceit.com/data/v4',
  API_KEYS: {
    FRIENDS_AND_TOOL: '67504c0b-4b7e-46c7-8227-1dd00f271614',
    LEADERBOARD: '4640b969-b9c4-4f35-a263-e0949fbe898e'
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { endpoint, useLeaderboardApi = false } = await req.json()
    
    if (!endpoint) {
      throw new Error('Endpoint is required')
    }

    console.log(`🎯 Discord-optimized Faceit Proxy: Making API call to: ${endpoint}`)
    
    const apiKey = useLeaderboardApi ? 
      FACEIT_CONFIG.API_KEYS.LEADERBOARD : 
      FACEIT_CONFIG.API_KEYS.FRIENDS_AND_TOOL;
    
    const fullUrl = `${FACEIT_CONFIG.API_BASE}${endpoint}`;
    
    // Retry logic specifically for Discord compatibility
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} for ${fullUrl}`);
        
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Discord-Faceit-Tool/1.0'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`⏰ Rate limited (attempt ${attempts})`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
              continue;
            }
            throw new Error('Rate limited');
          }
          
          if (response.status >= 500) {
            console.warn(`🔥 Server error (attempt ${attempts}): ${response.status}`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
              continue;
            }
            throw new Error('Server error');
          }

          if (response.status === 404) {
            console.warn('⚠️ Not found from Faceit API');
            return new Response(JSON.stringify({ error: 'Not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          console.warn(`⚠️ API Warning ${response.status}:`, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Discord-optimized Faceit Proxy: API call successful on attempt ${attempts}`);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempts} failed:`, error.message);
        
        if (attempts < maxAttempts) {
          const delay = 1000 * attempts;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;

  } catch (error) {
    console.error('❌ Discord-optimized Faceit Proxy final error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
