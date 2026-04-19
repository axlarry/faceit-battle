import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-discord-locale, x-discord-activity-storage-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const NICK_RE = /^[A-Za-z0-9 _.\-]{1,32}$/;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests to lcrypt.eu
const CACHE_TTL_MS = 120000;       // 120 seconds server-side cache
// 8s timeout — 2s buffer before Supabase free plan kills the function at 10s.
const FETCH_TIMEOUT_MS = 8000;

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

    // Full format with score: "WIN 13:10 Mirage (+30)" / "+30" / "30" (sign optional)
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
 * This fixes a regression where lcrypt.eu stopped populating today.elo.
 */
function fixTodayElo(data: any, nickname: string): any {
  if (!data || data.error) return data;

  const today = data.today;
  if (!today?.present || !today.count || today.count === 0) return data;

  const eloNum = parseEloValue(today.elo);

  // Log raw today object to help diagnose future issues
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

  if (eloNum !== 0) return data; // already correct, nothing to fix

  // today.elo is 0 but player played — compute from report
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
// Global FIFO queue — serialises all lcrypt.eu requests, enforces 2s gap
// ---------------------------------------------------------------------------

class GlobalRequestQueue {
  private queue: Array<{
    nickname: string;
    fetchFn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private inProgressNicknames = new Map<string, Promise<any>>();

  async enqueue(nickname: string, fetchFn: () => Promise<any>): Promise<any> {
    if (this.inProgressNicknames.has(nickname)) {
      return this.inProgressNicknames.get(nickname);
    }

    const promise = new Promise((resolve, reject) => {
      this.queue.push({ nickname, fetchFn, resolve, reject });
    });

    this.inProgressNicknames.set(nickname, promise);

    if (!this.processing) {
      this.processQueue();
    }

    return promise;
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const { nickname, fetchFn, resolve, reject } = item;

      try {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        const delay = Math.max(0, MIN_REQUEST_INTERVAL - elapsed);
        if (delay > 0) await new Promise(r => setTimeout(r, delay));

        this.lastRequestTime = Date.now();
        const result = await fetchFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.inProgressNicknames.delete(nickname);
      }
    }

    this.processing = false;
  }
}

const globalQueue = new GlobalRequestQueue();

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
  try {
    // 1. Check server cache first (skip when force_refresh=true)
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('lcrypt_cache')
        .select('data, expires_at')
        .eq('nickname', nickname)
        .single()

      if (cached && new Date(cached.expires_at) > new Date()) {
        // Apply ELO fix on cached data too — handles stale entries created
        // before the today.elo computation was added.
        return fixTodayElo(cached.data, nickname)
      }
    }

    // 2. Enqueue for rate-limited fetch
    return await globalQueue.enqueue(nickname, async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      try {
        const response = await fetch(
          `https://faceit.lcrypt.eu/?n=${encodeURIComponent(nickname)}`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'fossabot web proxy',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
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
        let data: any
        try {
          data = JSON.parse(rawText)
        } catch {
          console.error(`[lcrypt] Invalid JSON for ${nickname}: ${rawText.slice(0, 200)}`)
          return { error: true, isLive: false, message: 'Invalid JSON' }
        }

        // Fix today.elo before caching so stored data is always correct
        data = fixTodayElo(data, nickname)

        // 3. Cache the fixed response
        try {
          await supabase.from('lcrypt_cache').delete().eq('nickname', nickname)
          await supabase.from('lcrypt_cache').insert({
            nickname,
            data,
            expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString()
          })
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
    })

  } catch (error) {
    console.error(`[lcrypt] Fatal error for ${nickname}:`, error)
    return { error: true, isLive: false, message: error.message }
  }
}
