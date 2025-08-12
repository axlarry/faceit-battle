import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Single shared owner for password-protected, unauthenticated lists
const PUBLIC_OWNER_ID = '00000000-0000-0000-0000-000000000000';

type Action = 'list' | 'add' | 'update' | 'remove' | 'migrate_auto';

interface FriendPayload {
  player_id: string;
  nickname: string;
  avatar: string;
  level?: number;
  elo?: number;
  wins?: number;
  win_rate?: number;
  hs_rate?: number;
  kd_ratio?: number;
}

interface RequestBody {
  action: Action;
  password?: string;
  player?: FriendPayload;
  playerId?: string;
}

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Supabase service credentials missing');
  }
  return createClient(url, key);
}

function requirePassword(reqPassword?: string) {
  const expected = Deno.env.get('ACCESS_CODE');
  if (!expected) return true; // If not configured, skip check
  return reqPassword === expected;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { action } = body || {};

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = getServiceClient();

    // Public list fetch (no password required)
    if (action === 'list') {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('owner_id', PUBLIC_OWNER_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = (data || []).map((f: any) => ({
        player_id: f.player_id,
        nickname: f.nickname,
        avatar: f.avatar,
        level: f.level || 0,
        elo: f.elo || 0,
        wins: f.wins || 0,
        winRate: f.win_rate || 0,
        hsRate: f.hs_rate || 0,
        kdRatio: f.kd_ratio || 0,
      }));

      return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // For add/remove (and optionally update) enforce password
    const needsPassword = action === 'add' || action === 'remove' || action === 'update';
    if (needsPassword && !requirePassword(body.password)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'add' || action === 'update') {
      const p = body.player;
      if (!p || !p.player_id || !p.nickname || !p.avatar) {
        return new Response(JSON.stringify({ error: 'Invalid player payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Check existence
      const { data: existing, error: selErr } = await supabase
        .from('friends')
        .select('id')
        .eq('owner_id', PUBLIC_OWNER_ID)
        .eq('player_id', p.player_id)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing) {
        const { error: updErr } = await supabase
          .from('friends')
          .update({
            nickname: p.nickname,
            avatar: p.avatar,
            level: p.level ?? 0,
            elo: p.elo ?? 0,
            wins: p.wins ?? 0,
            win_rate: p.win_rate ?? 0,
            hs_rate: p.hs_rate ?? 0,
            kd_ratio: p.kd_ratio ?? 0,
          })
          .eq('owner_id', PUBLIC_OWNER_ID)
          .eq('player_id', p.player_id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('friends')
          .insert({
            owner_id: PUBLIC_OWNER_ID,
            player_id: p.player_id,
            nickname: p.nickname,
            avatar: p.avatar,
            level: p.level ?? 0,
            elo: p.elo ?? 0,
            wins: p.wins ?? 0,
            win_rate: p.win_rate ?? 0,
            hs_rate: p.hs_rate ?? 0,
            kd_ratio: p.kd_ratio ?? 0,
          } as any);
        if (insErr) throw insErr;
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'remove') {
      const id = body.playerId;
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing playerId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { error: delErr } = await supabase
        .from('friends')
        .delete()
        .eq('owner_id', PUBLIC_OWNER_ID)
        .eq('player_id', id);
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Auto-migrate: copy the largest old owner list into PUBLIC owner
    if (action === 'migrate_auto') {
      // Enforce password
      if (!requirePassword(body.password)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Fetch all owner_ids (excluding PUBLIC and null)
      const { data: ownersRaw, error: ownersErr } = await supabase
        .from('friends')
        .select('owner_id')
        .neq('owner_id', PUBLIC_OWNER_ID)
        .not('owner_id', 'is', null);
      if (ownersErr) throw ownersErr;

      const counts: Record<string, number> = {};
      for (const row of ownersRaw || []) {
        const oid = (row as any).owner_id as string;
        counts[oid] = (counts[oid] || 0) + 1;
      }

      // Determine source: prefer the non-public owner with the most rows; if none, fall back to rows with NULL owner_id (legacy data)
      const sourceOwnerId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      let sourceRows: any[] = [];
      if (sourceOwnerId) {
        const { data: srcRows, error: srcErr } = await supabase
          .from('friends')
          .select('*')
          .eq('owner_id', sourceOwnerId);
        if (srcErr) throw srcErr;
        sourceRows = (srcRows || []) as any[];
      } else {
        // Fallback: migrate legacy rows where owner_id IS NULL
        const { data: nullOwnerRows, error: nullErr } = await supabase
          .from('friends')
          .select('*')
          .is('owner_id', null);
        if (nullErr) throw nullErr;
        if (!nullOwnerRows || nullOwnerRows.length === 0) {
          return new Response(JSON.stringify({ migratedInserted: 0, migratedUpdated: 0, sourceOwnerId: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        sourceRows = (nullOwnerRows || []) as any[];
      }

      // Load existing public player_ids
      const { data: existingPublic, error: existErr } = await supabase
        .from('friends')
        .select('player_id')
        .eq('owner_id', PUBLIC_OWNER_ID);
      if (existErr) throw existErr;

      const existingSet = new Set((existingPublic || []).map((r: any) => r.player_id as string));

      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      for (const f of sourceRows || []) {
        const payload = {
          owner_id: PUBLIC_OWNER_ID,
          player_id: (f as any).player_id,
          nickname: (f as any).nickname,
          avatar: (f as any).avatar,
          level: (f as any).level ?? 0,
          elo: (f as any).elo ?? 0,
          wins: (f as any).wins ?? 0,
          win_rate: (f as any).win_rate ?? 0,
          hs_rate: (f as any).hs_rate ?? 0,
          kd_ratio: (f as any).kd_ratio ?? 0,
        } as any;
        if (!existingSet.has((f as any).player_id)) {
          toInsert.push(payload);
        } else {
          toUpdate.push(payload);
        }
      }

      let inserted = 0;
      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('friends').insert(toInsert as any);
        if (insErr) throw insErr;
        inserted = toInsert.length;
      }

      let updated = 0;
      // Update records one-by-one to avoid onConflict requirements
      for (const u of toUpdate) {
        const { error: updErr } = await supabase
          .from('friends')
          .update({
            nickname: u.nickname,
            avatar: u.avatar,
            level: u.level,
            elo: u.elo,
            wins: u.wins,
            win_rate: u.win_rate,
            hs_rate: u.hs_rate,
            kd_ratio: u.kd_ratio,
          })
          .eq('owner_id', PUBLIC_OWNER_ID)
          .eq('player_id', u.player_id);
        if (updErr) throw updErr;
        updated += 1;
      }

      return new Response(JSON.stringify({ migratedInserted: inserted, migratedUpdated: updated, sourceOwnerId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
