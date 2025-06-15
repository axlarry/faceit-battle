
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
    // Get the API key from environment variables
    const apiKey = Deno.env.get('FACEIT_API_KEY')
    
    if (!apiKey) {
      console.error('FACEIT_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'FACEIT_API_KEY not configured',
          apiKey: null 
        }),
        { 
          status: 200, // Return 200 instead of 500 so the client can handle it
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log('FACEIT_API_KEY found, returning to client')
    return new Response(
      JSON.stringify({ apiKey }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in get-faceit-api-key function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        apiKey: null 
      }),
      { 
        status: 200, // Return 200 so client can handle gracefully
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
