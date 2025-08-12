import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent absolute URLs and ensure a leading slash
    if (endpoint.includes('://') || endpoint.includes('..')) {
      return new Response(JSON.stringify({ error: 'Malformed endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const apiKey = Deno.env.get('FACEIT_API_KEY');
    if (!apiKey) {
      throw new Error('FACEIT_API_KEY not configured');
    }

    const url = `https://open.faceit.com/data/v4${cleanedEndpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    const body = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : null;

    if (!response.ok) {
      const statusText = response.statusText || 'Request failed';
      const payload = body || { error: statusText };
      return new Response(JSON.stringify(payload), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in faceit-proxy:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
