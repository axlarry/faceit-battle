import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Single shared owner for password-protected, unauthenticated lists
const PUBLIC_OWNER_ID = '00000000-0000-0000-0000-000000000000';

type Action = 'list' | 'add' | 'update' | 'remove';

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
    const needsPassword = action === 'add' || action === 'remove';
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

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
