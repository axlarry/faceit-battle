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

  // Origin allowlist (optional): set ORIGIN_ALLOWLIST secret as comma-separated list
  const origin = req.headers.get('origin')?.toLowerCase() || '';
  const allowlist = (Deno.env.get('ORIGIN_ALLOWLIST') || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length && origin && !allowlist.includes(origin)) {
    console.log('faceit-proxy blocked origin:', origin);
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Simple in-memory rate limiter (per-instance)
  const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
  const RATE_LIMIT_MAX = 60; // max requests per window per IP
  const rl = (globalThis as any).FACEIT_PROXY_RL || new Map<string, { count: number; ts: number }>();
  (globalThis as any).FACEIT_PROXY_RL = rl;

  const getClientId = () => {
    const ip = req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    return ip;
  };

  try {
    const { endpoint } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent absolute URLs and traversal
    if (endpoint.includes('://') || endpoint.includes('..')) {
      return new Response(JSON.stringify({ error: 'Malformed endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Allowlist of safe endpoints (tighten as needed)
    const allowedPatterns = [
      /^\/players\/[^/]+$/,
      /^\/players\/[^/]+\/stats\/cs2$/,
      /^\/players\/[^/]+\/history\?game=cs2(&|$)/,
      /^\/search\/players\?nickname=[^&]+&game=cs2(&|$)/,
      /^\/rankings\/games\/cs2\/regions\/[^/?]+(\?limit=\d+)?$/,
      /^\/matches\/[^/]+$/,
      /^\/matches\/[^/]+\/stats$/,
    ];

    const isAllowed = allowedPatterns.some((re) => re.test(cleanedEndpoint));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Endpoint not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit per IP
    const cid = getClientId();
    const now = Date.now();
    const entry = rl.get(cid);
    if (!entry || now - entry.ts > RATE_LIMIT_WINDOW_MS) {
      rl.set(cid, { count: 1, ts: now });
    } else {
      if (entry.count >= RATE_LIMIT_MAX) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      entry.count += 1;
    }

    const apiKey = Deno.env.get('FACEIT_API_KEY');
    if (!apiKey) {
      // Do not leak configuration details
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      const payload = body || { error: 'Request failed' };
      return new Response(JSON.stringify(payload), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_error) {
    // Avoid logging sensitive data; return generic error
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
