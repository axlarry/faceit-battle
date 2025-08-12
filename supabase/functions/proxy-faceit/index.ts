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
const ALLOWED_ENDPOINTS: RegExp[] = [
  /^\/players\?[A-Za-z0-9_=&%\-]+$/,
  /^\/players\/[A-Za-z0-9_-]+$/,
  /^\/players\/[A-Za-z0-9_-]+\/stats\/cs2$/,
  /^\/players\/[A-Za-z0-9_-]+\/history\?game=cs2(&limit=\d+)?$/,
  /^\/rankings\/games\/cs2\/regions\/[A-Za-z]+(\?offset=\d+&limit=\d+|\?limit=\d+)?$/,
  /^\/matches\/[A-Za-z0-9-]+$/,
  /^\/matches\/[A-Za-z0-9-]+\/stats$/,
  /^\/search\/players\?nickname=[A-Za-z0-9%._-]+(&game=cs2)?$/,
  /^\/search\/matches\?type=ongoing&game=cs2(&limit=\d+)?$/
];

// Simple in-memory rate limiter per IP
class RateLimiter {
  private hits: Map<string, number[]> = new Map();
  constructor(private limit: number, private windowMs: number) {}
  allow(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const arr = this.hits.get(key) || [];
    const recent = arr.filter((t) => t > windowStart);
    if (recent.length >= this.limit) return false;
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

const proxyLimiter = new RateLimiter(60, 60_000); // 60 Faceit calls/min per IP


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, useLeaderboardApi = false } = (await req.json()) as ProxyRequestBody;

    console.log(`[proxy-faceit] incoming`, { endpoint, useLeaderboardApi });

    // Rate limit per IP to protect API key quota
    const ip = getClientIp(req);
    if (!proxyLimiter.allow(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid endpoint' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (endpoint.length > 200) {
      return new Response(JSON.stringify({ error: 'Endpoint too long' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Basic validation to prevent full URL proxying
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return new Response(JSON.stringify({ error: 'Absolute URLs are not allowed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Allowlist check
    const isAllowed = ALLOWED_ENDPOINTS.some((re) => re.test(endpoint));
    console.log(`[proxy-faceit] allowlist`, { endpoint, isAllowed });
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Endpoint not allowed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Choose API key based on usage
    const defaultKey = Deno.env.get('FACEIT_API_KEY');
    const leaderboardKey = Deno.env.get('FACEIT_LEADERBOARD_API_KEY') || Deno.env.get('FACEIT_ANALYSER_API_KEY') || defaultKey;
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
      console.log(`[proxy-faceit] faceit error`, { endpoint, status: response.status });
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const text = await response.text();
      return new Response(JSON.stringify({ error: 'Faceit API error', status: response.status, details: text }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    console.log(`[proxy-faceit] success`, { endpoint });
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
