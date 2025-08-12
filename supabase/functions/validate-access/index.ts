import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (per-instance)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max attempts per window per IP
const rl = (globalThis as any).ACCESS_VALIDATE_RL || new Map<string, { count: number; ts: number }>();
(globalThis as any).ACCESS_VALIDATE_RL = rl;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || code.length < 1 || code.length > 128) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit per IP
    const ip = req.headers.get('cf-connecting-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const now = Date.now();
    const entry = rl.get(ip);
    if (!entry || now - entry.ts > RATE_LIMIT_WINDOW_MS) {
      rl.set(ip, { count: 1, ts: now });
    } else {
      if (entry.count >= RATE_LIMIT_MAX) {
        return new Response(JSON.stringify({ ok: false, error: 'Too many attempts' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      entry.count += 1;
    }

    const secret = Deno.env.get('ACCESS_CODE');
    if (!secret) {
      return new Response(JSON.stringify({ ok: false, error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ok = code === secret;
    // Always return 200 with ok flag to prevent enumeration via status codes
    return new Response(JSON.stringify({ ok }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
