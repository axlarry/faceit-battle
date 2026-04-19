import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-discord-locale, x-discord-activity-storage-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const NICK_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const CACHE_TTL_MS = 120000;  // 120 seconds server-side cache
const FETCH_TIMEOUT_MS = 8000; // 8s — 2s buffer before Supabase free plan kills at 10s

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// ---------------------------------------------------------------------------
// Report-based ELO computation
// ---------------------------------------------------------------------------

interface ReportMatch {
  result: 'WIN' | 'LOSE';
  score: string;
  map: string;
  eloChange: number;
}

function parseLcryptReport(report: string): ReportMatch[] {
  if (!report || typeof report !== 'string') return [];
  const out: ReportMatch[] = [];
  const parts = report.split(', ');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Full format with score: "WIN 13:10 Mirage (+30)" / sign optional
    const full = trimmed.match(/^(WIN|LOSE)\s+(\d+[:\-]\d+)\s+(.+?)\s+\(?([+-]?\d+)\)?$/);
    if (full) {
      let eloChange = parseInt(full[4], 10);
      if (full[1] === 'LOSE' && eloChange > 0) eloChange = -eloChange;
      out.push({ result: full[1] as 'WIN' | 'LOSE', score: full[2], map: full[3].trim(), eloChange });
      continue;
    }

    // No score: "WIN Mirage +30" / "WIN Mirage 30"
    const noScore = trimmed.match(/^(WIN|LOSE)\s+(.+?)\s+\(?([+-]?\d+)\)?$/);
    if (noScore) {
      let eloChange = parseInt(noScore[3], 10);
      if (noScore[1] === 'LOSE' && eloChange > 0) eloChange = -eloChange;
      out.push({ result: noScore[1] as 'WIN' | 'LOSE', score: '', map: noScore[2].trim(), eloChange });
    }
  }
  return out;
}

function parseEloValue(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const n = parseInt(raw.replace(/\s/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * If the lcrypt API returns today.elo = 0 but the player played today,
 * compute the ELO from the report string (which always carries per-match ELO).
 */
function fixTodayElo(data: any, nickname: string): any {
  if (!data || data.error) return data;

  const today = data.today;
  if (!today?.present || !today.count || today.count === 0) return data;

  const eloNum = parseEloValue(today.elo);

  console.log(`[lcrypt][${nickname}] today raw:`, JSON.stringify({
    present: today.present,
    count: today.count,
    win: today.win,
    lose: today.lose,
    elo: today.elo,
    elo_win: today.elo_win,
    elo_lose: today.elo_lose,
    report_snippet: data.report?.slice(0, 120),
  }));

  if (eloNum !== 0) return data; // already correct

  if (!data.report) {
    console.warn(`[lcrypt][${nickname}] today.elo=0 and no report field; cannot compute ELO`);
    return data;
  }

  const reportMatches = parseLcryptReport(data.report);
  const todaySlice = reportMatches.slice(0, today.count as number);

  if (todaySlice.length === 0) {
    console.warn(`[lcrypt][${nickname}] today.elo=0 but parseLcryptReport returned 0 matches from: ${data.report?.slice(0, 120)}`);
    return data;
  }

  const computedElo = todaySlice.reduce((s, m) => s + m.eloChange, 0);
  const computedEloWin = todaySlice
    .filter(m => m.result === 'WIN')
    .reduce((s, m) => s + m.eloChange, 0);
  const computedEloLose = Math.abs(
    todaySlice
      .filter(m => m.result === 'LOSE')
      .reduce((s, m) => s + m.eloChange, 0)
  );

  console.log(`[lcrypt][${nickname}] computed today.elo=${computedElo} from report (${todaySlice.length} matches)`);

  return {
    ...data,
    today: {
      ...today,
      elo: computedElo,
      elo_win: parseEloValue(today.elo_win) || computedEloWin,
      elo_lose: parseEloValue(today.elo_lose) || computedEloLose,
    },
  };
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { nickname, force_refresh } = body

    if (!nickname || !NICK_RE.test(nickname)) {
      throw new Error('Invalid nickname')
    }

    const result = await processLcryptRequest(nickname, !!force_refresh)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('lcrypt endpoint error:', error)
    return new Response(
      JSON.stringify({ error: error.message, isLive: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processLcryptRequest(nickname: string, forceRefresh = false) {
  // 1. Check server cache first (skip when force_refresh=true)
  if (!forceRefresh) {
    try {
      const { data: cached } = await supabase
        .from('lcrypt_cache')
        .select('data, expires_at')
        .eq('nickname', nickname)
        .single()

      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log(`[lcrypt][${nickname}] serving from cache`)
        return fixTodayElo(cached.data, nickname)
      }
    } catch (cacheReadError) {
      console.warn(`[lcrypt][${nickname}] cache read error:`, cacheReadError)
    }
  }

  // 2. Fetch directly from lcrypt.eu (no queue — client-side LcryptQueue already serializes)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    console.log(`[lcrypt][${nickname}] fetching from lcrypt.eu`)

    const response = await fetch(
      `https://faceit.lcrypt.eu/?n=${encodeURIComponent(nickname)}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'fossabot web proxy',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://fossabot.com/',
          'Origin': 'https://fossabot.com',
        }
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`[lcrypt] HTTP ${response.status} for ${nickname}: ${body.slice(0, 200)}`)
      return { error: true, isLive: false, message: `HTTP ${response.status}` }
    }

    const rawText = await response.text()
    console.log(`[lcrypt][${nickname}] raw response (first 300 chars): ${rawText.slice(0, 300)}`)

    let data: any
    try {
      data = JSON.parse(rawText)
    } catch {
      console.error(`[lcrypt] Invalid JSON for ${nickname}: ${rawText.slice(0, 200)}`)
      return { error: true, isLive: false, message: 'Invalid JSON' }
    }

    // Fix today.elo before caching
    data = fixTodayElo(data, nickname)

    // 3. Cache the fixed response
    try {
      await supabase.from('lcrypt_cache').upsert({
        nickname,
        data,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
      }, { onConflict: 'nickname' })
    } catch (cacheError) {
      console.error(`[lcrypt] Cache write failed for ${nickname}:`, cacheError)
    }

    return data

  } catch (error) {
    clearTimeout(timeoutId)
    const msg = (error as Error).message || 'Fetch failed'
    console.error(`[lcrypt] Fetch failed for ${nickname}: ${msg}`)
    return { error: true, isLive: false, message: msg }
  }
}
