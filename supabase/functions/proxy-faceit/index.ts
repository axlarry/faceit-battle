import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProxyRequestBody {
  endpoint: string;
  useLeaderboardApi?: boolean;
}

const FACEIT_BASE = 'https://open.faceit.com/data/v4';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, useLeaderboardApi = false } = (await req.json()) as ProxyRequestBody;

    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid endpoint' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Basic validation to prevent full URL proxying
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return new Response(JSON.stringify({ error: 'Absolute URLs are not allowed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Choose API key based on usage
    const defaultKey = Deno.env.get('FACEIT_API_KEY');
    const leaderboardKey = Deno.env.get('FACEIT_ANALYSER_API_KEY') || defaultKey;
    const apiKey = useLeaderboardApi ? leaderboardKey : defaultKey;

    if (!apiKey) {
      throw new Error('FACEIT_API_KEY not configured');
    }

    const url = `${FACEIT_BASE}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const text = await response.text();
      return new Response(JSON.stringify({ error: 'Faceit API error', status: response.status, details: text }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
