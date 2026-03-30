import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-discord-locale, x-discord-activity-storage-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

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
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
}

const friendsListLimiter     = new RateLimiter(120, 60_000);  // 120 req/min — read
const friendsMutationLimiter = new RateLimiter(30,  60_000);  // 30 req/min  — admin mutations
const cacheUpdateLimiter     = new RateLimiter(200, 60_000);  // 200 req/min — background cache writes

const PUBLIC_OWNER_ID = '00000000-0000-0000-0000-000000000000';

type Action =
  | 'list'
  | 'add'
  | 'update'
  | 'remove'
  | 'migrate_auto'
  | 'refresh_all'
  | 'update_nickname'
  | 'sync_nickname'
  | 'update_cache';

interface FriendPayload {
  player_id: string;
  nickname?: string;
  avatar?: string;
  level?: number;
  elo?: number;
  wins?: number;
  win_rate?: number;
  hs_rate?: number;
  kd_ratio?: number;
  // Persistent display-cache fields
  cover_image?: string | null;
  country?: string | null;
  country_flag?: string | null;
  region?: string | null;
  region_ranking?: number | null;
  country_ranking?: number | null;
}

interface RequestBody {
  action: Action;
  password?: string;
  player?: FriendPayload;
  playerId?: string;
  newNickname?: string;
  newAvatar?: string;
}

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase service credentials missing');
  return createClient(url, key);
}

function safeEqual(a?: string, b?: string) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

function requirePassword(reqPassword?: string) {
  const expected = Deno.env.get('ACCESS_CODE') || '';
  if (!expected) return false;
  return safeEqual(String(reqPassword ?? ''), expected);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const { action } = body || {};
    if (!action) return json({ error: 'Missing action' }, 400);

    const ip = getClientIp(req);

    // ── update_cache: no password, high-throughput rate limit ────────────────
    if (action === 'update_cache') {
      if (!cacheUpdateLimiter.allow(ip)) return json({ error: 'Too many requests' }, 429);

      const p = body.player;
      if (!p?.player_id) return json({ error: 'Missing player_id' }, 400);

      const supabase = getServiceClient();

      // Build update payload — only include fields that are explicitly provided
      const patch: Record<string, unknown> = { last_cached_at: new Date().toISOString() };
      if (p.nickname      !== undefined) patch.nickname       = p.nickname;
      if (p.avatar        !== undefined) patch.avatar         = p.avatar;
      if (p.level         !== undefined) patch.level          = p.level;
      if (p.elo           !== undefined) patch.elo            = p.elo;
      if (p.wins          !== undefined) patch.wins           = p.wins;
      if (p.win_rate      !== undefined) patch.win_rate       = p.win_rate;
      if (p.hs_rate       !== undefined) patch.hs_rate        = p.hs_rate;
      if (p.kd_ratio      !== undefined) patch.kd_ratio       = p.kd_ratio;
      if (p.cover_image   !== undefined) patch.cover_image    = p.cover_image;
      if (p.country       !== undefined) patch.country        = p.country;
      if (p.country_flag  !== undefined) patch.country_flag   = p.country_flag;
      if (p.region        !== undefined) patch.region         = p.region;
      if (p.region_ranking   !== undefined) patch.region_ranking   = p.region_ranking;
      if (p.country_ranking  !== undefined) patch.country_ranking  = p.country_ranking;

      const { error } = await supabase
        .from('friends')
        .update(patch)
        .eq('owner_id', PUBLIC_OWNER_ID)
        .eq('player_id', p.player_id);

      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    // ── list: public, no password ─────────────────────────────────────────────
    if (action === 'list') {
      if (!friendsListLimiter.allow(ip)) return json({ error: 'Too many requests' }, 429);

      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('owner_id', PUBLIC_OWNER_ID)
        .order('elo', { ascending: false });

      if (error) throw error;

      const items = (data || []).map((f: any) => ({
        player_id:      f.player_id,
        nickname:       f.nickname,
        avatar:         f.avatar,
        cover_image:    f.cover_image    ?? null,
        country:        f.country        ?? null,
        country_flag:   f.country_flag   ?? null,
        region:         f.region         ?? null,
        region_ranking: f.region_ranking ?? 0,
        country_ranking:f.country_ranking?? 0,
        level:          f.level          ?? 0,
        elo:            f.elo            ?? 0,
        wins:           f.wins           ?? 0,
        winRate:        f.win_rate       ?? 0,
        hsRate:         f.hs_rate        ?? 0,
        kdRatio:        f.kd_ratio       ?? 0,
      }));

      return json({ items });
    }

    // ── mutations: require rate-limit check ───────────────────────────────────
    if (!friendsMutationLimiter.allow(ip)) return json({ error: 'Too many requests' }, 429);

    const supabase = getServiceClient();

    // ── add / update ──────────────────────────────────────────────────────────
    if (action === 'add' || action === 'update') {
      const needsPassword = action === 'add' || action === 'update';
      if (needsPassword && !requirePassword(body.password)) return json({ error: 'Unauthorized' }, 401);

      const p = body.player;
      if (!p || !p.player_id || !p.nickname || !p.avatar) return json({ error: 'Invalid player payload' }, 400);

      const { data: existing, error: selErr } = await supabase
        .from('friends').select('id')
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', p.player_id).maybeSingle();
      if (selErr) throw selErr;

      const payload: any = {
        nickname:  p.nickname,
        avatar:    p.avatar,
        level:     p.level    ?? 0,
        elo:       p.elo      ?? 0,
        wins:      p.wins     ?? 0,
        win_rate:  p.win_rate ?? 0,
        hs_rate:   p.hs_rate  ?? 0,
        kd_ratio:  p.kd_ratio ?? 0,
      };

      if (existing) {
        const { error: updErr } = await supabase.from('friends').update(payload)
          .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', p.player_id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('friends')
          .insert({ owner_id: PUBLIC_OWNER_ID, player_id: p.player_id, ...payload });
        if (insErr) throw insErr;
      }
      return json({ success: true });
    }

    // ── remove ────────────────────────────────────────────────────────────────
    if (action === 'remove') {
      if (!requirePassword(body.password)) return json({ error: 'Unauthorized' }, 401);
      const id = body.playerId;
      if (!id) return json({ error: 'Missing playerId' }, 400);
      const { error } = await supabase.from('friends').delete()
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', id);
      if (error) throw error;
      return json({ success: true });
    }

    // ── migrate_auto ──────────────────────────────────────────────────────────
    if (action === 'migrate_auto') {
      if (!requirePassword(body.password)) return json({ error: 'Unauthorized' }, 401);

      const { data: ownersRaw, error: ownersErr } = await supabase
        .from('friends').select('owner_id')
        .neq('owner_id', PUBLIC_OWNER_ID).not('owner_id', 'is', null);
      if (ownersErr) throw ownersErr;

      const counts: Record<string, number> = {};
      for (const row of ownersRaw || []) {
        const oid = (row as any).owner_id as string;
        counts[oid] = (counts[oid] || 0) + 1;
      }

      const sourceOwnerId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      let sourceRows: any[] = [];

      if (sourceOwnerId) {
        const { data, error } = await supabase.from('friends').select('*').eq('owner_id', sourceOwnerId);
        if (error) throw error;
        sourceRows = data || [];
      } else {
        const { data, error } = await supabase.from('friends').select('*').is('owner_id', null);
        if (error) throw error;
        if (!data?.length) return json({ migratedInserted: 0, migratedUpdated: 0, sourceOwnerId: null });
        sourceRows = data;
      }

      const { data: existingPublic, error: existErr } = await supabase
        .from('friends').select('player_id').eq('owner_id', PUBLIC_OWNER_ID);
      if (existErr) throw existErr;
      const existingSet = new Set((existingPublic || []).map((r: any) => r.player_id as string));

      const toInsert: any[] = [];
      const toUpdate: any[] = [];
      for (const f of sourceRows) {
        const p = {
          owner_id: PUBLIC_OWNER_ID,
          player_id: f.player_id, nickname: f.nickname, avatar: f.avatar,
          level: f.level ?? 0, elo: f.elo ?? 0, wins: f.wins ?? 0,
          win_rate: f.win_rate ?? 0, hs_rate: f.hs_rate ?? 0, kd_ratio: f.kd_ratio ?? 0,
        };
        existingSet.has(f.player_id) ? toUpdate.push(p) : toInsert.push(p);
      }

      let inserted = 0, updated = 0;
      if (toInsert.length > 0) {
        const { error } = await supabase.from('friends').insert(toInsert);
        if (error) throw error;
        inserted = toInsert.length;
      }
      for (const u of toUpdate) {
        const { error } = await supabase.from('friends').update({
          nickname: u.nickname, avatar: u.avatar, level: u.level, elo: u.elo,
          wins: u.wins, win_rate: u.win_rate, hs_rate: u.hs_rate, kd_ratio: u.kd_ratio,
        }).eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', u.player_id);
        if (error) throw error;
        updated++;
      }

      return json({ migratedInserted: inserted, migratedUpdated: updated, sourceOwnerId });
    }

    // ── refresh_all ───────────────────────────────────────────────────────────
    if (action === 'refresh_all') {
      if (!requirePassword(body.password)) return json({ error: 'Unauthorized' }, 401);

      const { data: friends, error: friendsErr } = await supabase
        .from('friends').select('*').eq('owner_id', PUBLIC_OWNER_ID);
      if (friendsErr) throw friendsErr;

      let updated = 0;
      const batchSize = 3;
      for (let i = 0; i < (friends || []).length; i += batchSize) {
        const batch = (friends || []).slice(i, i + batchSize);
        await Promise.all(batch.map(async (friend: any) => {
          try {
            const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-lcrypt-elo`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({ nickname: friend.nickname })
            });
            if (!res.ok) return;
            const d = await res.json();
            if (!d || d.error) return;
            const { error: upErr } = await supabase.from('friends').update({
              level: d.level || friend.level || 0,
              elo:   d.elo   || friend.elo   || 0,
            }).eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', friend.player_id);
            if (!upErr) updated++;
          } catch { /* ignore */ }
        }));
        if (i + batchSize < (friends || []).length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      return json({ updated, total: (friends || []).length });
    }

    // ── update_nickname ───────────────────────────────────────────────────────
    if (action === 'update_nickname') {
      if (!requirePassword(body.password)) return json({ error: 'Unauthorized' }, 401);
      const { playerId, newNickname, newAvatar } = body;
      if (!playerId || !newNickname) return json({ error: 'Missing playerId or newNickname' }, 400);
      const patch: any = { nickname: newNickname };
      if (newAvatar) patch.avatar = newAvatar;
      const { error } = await supabase.from('friends').update(patch)
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', playerId);
      if (error) throw error;
      return json({ success: true, updated: patch });
    }

    // ── sync_nickname ─────────────────────────────────────────────────────────
    if (action === 'sync_nickname') {
      if (!requirePassword(body.password)) return json({ error: 'Unauthorized' }, 401);
      const { playerId, newNickname, newAvatar } = body;
      if (!playerId || !newNickname) return json({ error: 'Missing playerId or newNickname' }, 400);

      const { data: existing, error: checkErr } = await supabase
        .from('friends').select('nickname, avatar').eq('owner_id', PUBLIC_OWNER_ID)
        .eq('player_id', playerId).maybeSingle();
      if (checkErr) throw checkErr;
      if (!existing) return json({ error: 'Friend not found' }, 404);

      if (existing.nickname === newNickname && (!newAvatar || existing.avatar === newAvatar)) {
        return json({ success: true, changed: false });
      }

      const patch: any = { nickname: newNickname };
      if (newAvatar && newAvatar !== existing.avatar) patch.avatar = newAvatar;

      const { error } = await supabase.from('friends').update(patch)
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', playerId);
      if (error) throw error;
      return json({ success: true, changed: true, updated: patch });
    }

    return json({ error: 'Unknown action' }, 400);

  } catch (e: any) {
    return json({ error: e.message || 'Unknown error' }, 500);
  }
});
