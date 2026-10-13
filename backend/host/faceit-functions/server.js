#!/usr/bin/env node
/**
 * faceit-functions — local replacement for the deleted Supabase project
 * (rwizxoeyatdtggrpnpmq). Ports the 4 Edge Functions + a minimal gotrue shim.
 * Original Deno sources: repo supabase/functions/* — semantics preserved 1:1.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

// ── env ──────────────────────────────────────────────────────────────────────
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const PORT = parseInt(process.env.PORT || '3002', 10);
const ACCESS_CODE = process.env.ACCESS_CODE || '';
const PUBLIC_OWNER_ID = '00000000-0000-0000-0000-000000000000';

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 8,
});

// ── tiny supabase-flavoured query builder (only what the functions used) ─────
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
function idf(col) {
  if (!IDENT.test(col)) throw new Error(`Invalid column name: ${col}`);
  return col;
}
class Builder {
  constructor(table) {
    this.table = idf(table);
    this.cols = '*';
    this.conds = []; // {sql, params}
    this.orders = [];
    this.limitN = null;
    this.mode = 'select';
    this.payload = null;
  }
  select(cols) { this.cols = cols; this.mode = 'select'; return this; }
  _add(condSql, param) { this.conds.push({ sql: condSql, params: param === undefined ? [] : [param] }); return this; }
  eq(col, val) { return this._add(`${idf(col)} = $${this._p()}`, val); }
  neq(col, val) { return this._add(`${idf(col)} <> $${this._p()}`, val); }
  is(col, val) { return val === null ? this._add(`${idf(col)} IS NULL`, undefined) : this._add(`${idf(col)} = $${this._p()}`, val); }
  not(col, op, val) {
    const inner = op === 'is' && val === null ? `${idf(col)} IS NULL` : `${idf(col)} ${op === 'is not' ? 'IS NOT NULL' : 'IS NULL'}`;
    return this._add(`NOT (${inner})`, undefined);
  }
  order(col, opts = {}) {
    const asc = opts.ascending !== false;
    this.orders.push(`${idf(col)} ${asc ? 'ASC' : 'DESC'}`);
    return this;
  }
  limit(n) { this.limitN = n; return this; }
  insert(rows) { this.mode = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  update(patch) { this.mode = 'update'; this.payload = patch; return this; }
  delete() { this.mode = 'delete'; return this; }
  _p() { // next param index: count params already bound
    return this.conds.reduce((acc, c) => acc + c.params.length, 0) + 1;
  }
  _collect() {
    let sql = `SELECT ${this.cols === '*' ? '*' : this.cols.split(',').map(c => idf(c.trim())).join(', ')} FROM public.${this.table}`;
    const params = [];
    if (this.conds.length) {
      // renumber placeholders sequentially across conds
      const whereSqls = [];
      let idx = 1;
      for (const c of this.conds) {
        const re = /\$(\d+)/g;
        const mapped = c.sql.replace(re, () => `$${idx++}`);
        whereSqls.push(mapped);
        params.push(...c.params);
      }
      sql += ' WHERE ' + whereSqls.join(' AND ');
    }
    return { sql, params };
  }
  async _exec() {
    try {
      if (this.mode === 'select') {
        let { sql, params } = this._collect();
        if (this.orders.length) sql += ' ORDER BY ' + this.orders.join(', ');
        if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
        const r = await pool.query(sql, params);
        return { data: r.rows, error: null };
      }
      if (this.mode === 'insert') {
        const rows = this.payload;
        const cols = [...new Set(rows.flatMap(r => Object.keys(r)))].map(idf);
        let pi = 1; const outParams = []; const tuplesFinal = [];
        for (const r of rows) {
          const items = [];
          for (const c of cols) {
            const v = r[c];
            if (v === undefined) { items.push('DEFAULT'); continue; }
            outParams.push(v === null ? null : v);
            items.push(`$${pi++}`);
          }
          tuplesFinal.push(`(${items.join(', ')})`);
        }
        const sql = `INSERT INTO public.${this.table} (${cols.join(', ')}) VALUES ${tuplesFinal.join(', ')} ON CONFLICT (owner_id, player_id) DO UPDATE SET ${cols.filter(c => c !== 'owner_id' && c !== 'player_id').map(c => `${c} = EXCLUDED.${c}`).join(', ')} RETURNING *`;
        const r = await pool.query(sql, outParams);
        return { data: r.rows, error: null };
      }
      if (this.mode === 'update') {
        const patch = this.payload;
        let sql = `UPDATE public.${this.table} SET `;
        const params = [];
        let idx = 1;
        for (const [k, v] of Object.entries(patch)) { sql += `${idf(k)} = $${idx++}, `; params.push(v === undefined ? null : v); }
        sql = sql.slice(0, -2);
        const w = this._collectForUpdate(idx, params);
        sql += w;
        const r = await pool.query(sql, params);
        return { data: r.rows, error: null };
      }
      if (this.mode === 'delete') {
        let { sql, params } = this._collectDelete();
        sql = `DELETE FROM public.${this.table}${sql} RETURNING *`;
        const r = await pool.query(sql, params);
        return { data: r.rows, error: null };
      }
      throw new Error('unsupported mode ' + this.mode);
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }
  _collectForUpdate(startIdx, params) {
    let idx = startIdx; const wheres = [];
    for (const c of this.conds) {
      wheres.push(c.sql.replace(/\$(\d+)/g, () => `$${idx++}`));
      params.push(...c.params);
    }
    return wheres.length ? ' WHERE ' + wheres.join(' AND ') : '';
  }
  _collectDelete() {
    const params = []; let idx = 1; const wheres = [];
    for (const c of this.conds) {
      const mapped = c.sql.replace(/\$(\d+)/g, () => `$${idx++}`);
      wheres.push(mapped);
      params.push(...c.params);
    }
    return { sql: wheres.length ? ' WHERE ' + wheres.join(' AND ') : '', params };
  }
  maybeSingle() { return this.limit(1)._exec().then(r => ({ data: r.data && r.data[0] ? r.data[0] : null, error: r.error })); }
  then(resolve, reject) { return this._exec().then(resolve, reject); }
}
function db() { return { from(t) { return new Builder(t); } }; }

// ── rate limiters (same windows as original) ─────────────────────────────────
class RateLimiter {
  constructor(limit, windowMs) { this.limit = limit; this.windowMs = windowMs; this.hits = new Map(); }
  allow(key) {
    const now = Date.now();
    const win = now - this.windowMs;
    const recent = (this.hits.get(key) || []).filter(t => t > win);
    if (recent.length >= this.limit) return false;
    recent.push(now); this.hits.set(key, recent);
    return true;
  }
}
function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || 'unknown';
}
const friendsListLimiter = new RateLimiter(120, 60000);
const friendsMutationLimiter = new RateLimiter(30, 60000);
const cacheUpdateLimiter = new RateLimiter(200, 60000);
const proxyLimiter = new RateLimiter(60, 60000);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-discord-locale, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
function send(res, status, body, contentType = 'application/json') {
  const data = body === null ? '' : (typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  res.writeHead(status, { ...cors, 'Content-Type': contentType });
  res.end(data);
}
function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function requirePassword(p) { const expected = ACCESS_CODE; if (!expected) return false; return safeEqual(String(p ?? ''), expected); }
function readJson(req) {
  return new Promise((resolve, reject) => {
    let buf = ''; let n = 0;
    req.on('data', c => { buf += c; n += c.length; if (n > 1_000_000) { req.destroy(); reject(new Error('body too large')); } });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(new Error('invalid JSON')); } });
    req.on('error', reject);
  });
}
const safeInt = v => { if (v == null) return null; const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10); return isNaN(n) ? null : n; };
const safeFloat = v => { if (v == null) return null; const n = parseFloat(String(v).replace(/[^0-9.-]/g, '')); return isNaN(n) ? null : n; };

// ── friends-gateway ──────────────────────────────────────────────────────────
async function friendsGateway(req, res) {
  let body;
  try { body = await readJson(req); } catch (e) { return send(res, 400, { error: e.message }); }
  const { action } = body || {};
  if (!action) return send(res, 400, { error: 'Missing action' });
  const ip = getClientIp(req);
  try {
    if (action === 'update_cache') {
      if (!cacheUpdateLimiter.allow(ip)) return send(res, 429, { error: 'Too many requests' });
      const p = body.player;
      if (!p?.player_id) return send(res, 400, { error: 'Missing player_id' });
      const patch = { last_cached_at: new Date().toISOString() };
      if (p.nickname !== undefined) patch.nickname = p.nickname ?? null;
      if (p.avatar !== undefined) patch.avatar = p.avatar ?? null;
      if (p.level !== undefined) patch.level = safeInt(p.level) ?? 0;
      if (p.elo !== undefined) patch.elo = safeInt(p.elo) ?? 0;
      if (p.wins !== undefined) patch.wins = safeInt(p.wins) ?? 0;
      if (p.win_rate !== undefined) patch.win_rate = safeFloat(p.win_rate) ?? 0;
      if (p.hs_rate !== undefined) patch.hs_rate = safeFloat(p.hs_rate) ?? 0;
      if (p.kd_ratio !== undefined) patch.kd_ratio = safeFloat(p.kd_ratio) ?? 0;
      if (p.cover_image !== undefined) patch.cover_image = p.cover_image ?? null;
      if (p.country !== undefined) patch.country = p.country ?? null;
      if (p.country_flag !== undefined) patch.country_flag = p.country_flag ?? null;
      if (p.region !== undefined) patch.region = p.region ?? null;
      if (p.region_ranking !== undefined) patch.region_ranking = safeInt(p.region_ranking);
      if (p.country_ranking !== undefined) patch.country_ranking = safeInt(p.country_ranking);
      const { error } = await db().from('friends').update(patch)
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', p.player_id);
      if (error) { console.error('[update_cache] DB', p.player_id, error.message); return send(res, 500, { error: error.message }); }
      return send(res, 200, { success: true });
    }
    if (action === 'list') {
      if (!friendsListLimiter.allow(ip)) return send(res, 429, { error: 'Too many requests' });
      const { data, error } = await db().from('friends').select('*')
        .eq('owner_id', PUBLIC_OWNER_ID).order('elo', { ascending: false });
      if (error) throw error;
      const items = (data || []).map(f => ({
        player_id: f.player_id, nickname: f.nickname, avatar: f.avatar,
        cover_image: f.cover_image ?? null, country: f.country ?? null,
        country_flag: f.country_flag ?? null, region: f.region ?? null,
        region_ranking: f.region_ranking ?? 0, country_ranking: f.country_ranking ?? 0,
        level: f.level ?? 0, elo: f.elo ?? 0, wins: f.wins ?? 0,
        winRate: f.win_rate ?? 0, hsRate: f.hs_rate ?? 0, kdRatio: f.kd_ratio ?? 0,
      }));
      return send(res, 200, { items });
    }
    if (!friendsMutationLimiter.allow(ip)) return send(res, 429, { error: 'Too many requests' });
    if (action === 'add' || action === 'update') {
      if (!requirePassword(body.password)) return send(res, 401, { error: 'Unauthorized' });
      const p = body.player;
      if (!p || !p.player_id || !p.nickname || !p.avatar) return send(res, 400, { error: 'Invalid player payload' });
      const { data: existing, error: selErr } = await db().from('friends').select('id')
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', p.player_id).maybeSingle();
      if (selErr) throw selErr;
      const payload = {
        nickname: p.nickname, avatar: p.avatar, level: p.level ?? 0, elo: p.elo ?? 0,
        wins: p.wins ?? 0, win_rate: p.win_rate ?? 0, hs_rate: p.hs_rate ?? 0, kd_ratio: p.kd_ratio ?? 0,
      };
      const r = existing
        ? await db().from('friends').update(payload).eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', p.player_id)
        : await db().from('friends').insert({ owner_id: PUBLIC_OWNER_ID, player_id: p.player_id, ...payload });
      if (r.error) throw new Error(r.error.message);
      return send(res, 200, { success: true });
    }
    if (action === 'remove') {
      if (!requirePassword(body.password)) return send(res, 401, { error: 'Unauthorized' });
      const pid = body.playerId;
      if (!pid) return send(res, 400, { error: 'Missing playerId' });
      const { error } = await db().from('friends').delete()
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', pid);
      if (error) throw error;
      return send(res, 200, { success: true });
    }
    if (action === 'migrate_auto') {
      if (!requirePassword(body.password)) return send(res, 401, { error: 'Unauthorized' });
      const { data: ownersRaw, error: ownersErr } = await db().from('friends').select('owner_id')
        .neq('owner_id', PUBLIC_OWNER_ID).not('owner_id', 'is', null);
      if (ownersErr) throw ownersErr;
      const counts = {};
      for (const row of ownersRaw || []) { const oid = row.owner_id; counts[oid] = (counts[oid] || 0) + 1; }
      const sourceOwnerId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      let sourceRows = [];
      if (sourceOwnerId) {
        const { data, error } = await db().from('friends').select('*').eq('owner_id', sourceOwnerId);
        if (error) throw error;
        sourceRows = data || [];
      } else {
        const { data, error } = await db().from('friends').select('*').is('owner_id', null);
        if (error) throw error;
        if (!data?.length) return send(res, 200, { migratedInserted: 0, migratedUpdated: 0, sourceOwnerId: null });
        sourceRows = data;
      }
      const { data: existingPublic, error: existErr } = await db().from('friends').select('player_id').eq('owner_id', PUBLIC_OWNER_ID);
      if (existErr) throw existErr;
      const existingSet = new Set((existingPublic || []).map(r => r.player_id));
      const toInsert = [], toUpdate = [];
      for (const f of sourceRows) {
        const p = {
          owner_id: PUBLIC_OWNER_ID, player_id: f.player_id, nickname: f.nickname, avatar: f.avatar,
          level: f.level ?? 0, elo: f.elo ?? 0, wins: f.wins ?? 0,
          win_rate: f.win_rate ?? 0, hs_rate: f.hs_rate ?? 0, kd_ratio: f.kd_ratio ?? 0,
        };
        existingSet.has(f.player_id) ? toUpdate.push(p) : toInsert.push(p);
      }
      let inserted = 0, updated = 0;
      if (toInsert.length) {
        const { error } = await db().from('friends').insert(toInsert);
        if (error) throw error;
        inserted = toInsert.length;
      }
      for (const u of toUpdate) {
        const { error } = await db().from('friends').update({
          nickname: u.nickname, avatar: u.avatar, level: u.level, elo: u.elo,
          wins: u.wins, win_rate: u.win_rate, hs_rate: u.hs_rate, kd_ratio: u.kd_ratio,
        }).eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', u.player_id);
        if (error) throw error;
        updated++;
      }
      return send(res, 200, { migratedInserted: inserted, migratedUpdated: updated, sourceOwnerId });
    }
    if (action === 'refresh_all') {
      if (!requirePassword(body.password)) return send(res, 401, { error: 'Unauthorized' });
      const { data: friends, error: friendsErr } = await db().from('friends').select('*').eq('owner_id', PUBLIC_OWNER_ID);
      if (friendsErr) throw friendsErr;
      let updated = 0;
      const batchSize = 3;
      const SUPABASE_URL = process.env.SUPABASE_URL || `http://127.0.0.1:${PORT}`;
      const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'shim';
      for (let i = 0; i < (friends || []).length; i += batchSize) {
        const batch = (friends || []).slice(i, i + batchSize);
        await Promise.all(batch.map(async friend => {
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/proxy-faceit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
              body: JSON.stringify({ endpoint: `/players?nickname=${encodeURIComponent(friend.nickname)}` }),
            });
            if (!r.ok) return;
            const d = await r.json();
            if (!d || !d.games?.cs2) return;
            const elo = d.games.cs2.faceit_elo ?? 0;
            const level = d.games.cs2.skill_level ?? 0;
            const { error: upErr } = await db().from('friends').update({ level, elo })
              .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', friend.player_id);
            if (!upErr) updated++;
          } catch { /* ignore */ }
        }));
        if (i + batchSize < (friends || []).length) await new Promise(r => setTimeout(r, 500));
      }
      return send(res, 200, { updated, total: (friends || []).length });
    }
    if (action === 'update_nickname') {
      if (!requirePassword(body.password)) return send(res, 401, { error: 'Unauthorized' });
      const { playerId, newNickname, newAvatar } = body;
      if (!playerId || !newNickname) return send(res, 400, { error: 'Missing playerId or newNickname' });
      const patch = { nickname: newNickname };
      if (newAvatar) patch.avatar = newAvatar;
      const { error } = await db().from('friends').update(patch)
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', playerId);
      if (error) throw error;
      return send(res, 200, { success: true, updated: patch });
    }
    if (action === 'sync_nickname') {
      if (!requirePassword(body.password)) return send(res, 401, { error: 'Unauthorized' });
      const { playerId, newNickname, newAvatar } = body;
      if (!playerId || !newNickname) return send(res, 400, { error: 'Missing playerId or newNickname' });
      const { data: existing, error: checkErr } = await db().from('friends').select('nickname, avatar')
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', playerId).maybeSingle();
      if (checkErr) throw checkErr;
      if (!existing) return send(res, 404, { error: 'Friend not found' });
      if (existing.nickname === newNickname && (!newAvatar || existing.avatar === newAvatar)) return send(res, 200, { success: true, changed: false });
      const patch = { nickname: newNickname };
      if (newAvatar && newAvatar !== existing.avatar) patch.avatar = newAvatar;
      const { error } = await db().from('friends').update(patch)
        .eq('owner_id', PUBLIC_OWNER_ID).eq('player_id', playerId);
      if (error) throw error;
      return send(res, 200, { success: true, changed: true, updated: patch });
    }
    return send(res, 400, { error: 'Unknown action' });
  } catch (e) {
    console.error('[friends-gateway]', e.message);
    return send(res, 500, { error: e.message || 'Unknown error' });
  }
}

// ── proxy-faceit ─────────────────────────────────────────────────────────────
const FACEIT_BASE = 'https://open.faceit.com/data/v4';
const ALLOWED_ENDPOINTS = [
  /^\/players\?[A-Za-z0-9_=&%\-]+$/,
  /^\/players\/[A-Za-z0-9_-]+$/,
  /^\/players\/[A-Za-z0-9_-]+\/stats\/cs2$/,
  /^\/players\/[A-Za-z0-9_-]+\/history\?game=cs2(&limit=\d+)?$/,
  /^\/rankings\/games\/cs2\/regions\/[A-Za-z]+(\?offset=\d+&limit=\d+|\?limit=\d+)?$/,
  /^\/matches\/[A-Za-z0-9-]+$/,
  /^\/matches\/[A-Za-z0-9-]+\/stats$/,
  /^\/search\/players\?nickname=[A-Za-z0-9%._-]+(&game=cs2)?$/,
  /^\/search\/matches\?type=ongoing&game=cs2(&limit=\d+)?$/,
];
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(t);
      return response;
    } catch (error) {
      lastError = error;
      console.log(`[proxy-faceit] fetch attempt ${attempt + 1} failed:`, error.message);
      if (error.name === 'AbortError') throw new Error('Request timeout');
      if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
  throw lastError || new Error('Network request failed');
}
async function proxyFaceit(req, res) {
  try {
    const { endpoint, useLeaderboardApi = false } = await readJson(req);
    const ip = getClientIp(req);
    if (!proxyLimiter.allow(ip)) return send(res, 429, { error: 'Too many requests' });
    if (!endpoint || typeof endpoint !== 'string') return send(res, 400, { error: 'Missing or invalid endpoint' });
    if (endpoint.length > 200) return send(res, 400, { error: 'Endpoint too long' });
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return send(res, 400, { error: 'Absolute URLs are not allowed' });
    if (!ALLOWED_ENDPOINTS.some(re => re.test(endpoint))) return send(res, 400, { error: 'Endpoint not allowed' });
    const defaultKey = process.env.FACEIT_API_KEY;
    const leaderboardKey = process.env.FACEIT_LEADERBOARD_API_KEY || process.env.FACEIT_ANALYSER_API_KEY || defaultKey;
    const apiKey = useLeaderboardApi ? leaderboardKey : defaultKey;
    if (!apiKey) throw new Error('FACEIT_API_KEY not configured');
    const response = await fetchWithRetry(`${FACEIT_BASE}${endpoint}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 429) return send(res, 429, { error: 'Rate limited' });
      if (response.status === 404 && endpoint.includes('/search/')) return send(res, 200, { items: [] });
      const text = await response.text();
      return send(res, response.status, { error: 'Faceit API error', status: response.status, details: text });
    }
    return send(res, 200, await response.json());
  } catch (e) {
    console.error('[proxy-faceit]', e.message);
    return send(res, 500, { error: e.message || 'Unknown error' });
  }
}

// ── get-faceit-analyser-data ─────────────────────────────────────────────────
const ENDPOINT_ALLOWLIST = new Set(['stats', 'overview', 'matches', 'hubs', 'maps', 'names', 'highlights', 'playerGraphs']);
const NICK_RE = /^[A-Za-z0-9 _.\\-]{1,32}$/;
const RATE_HITS = new Map();
function checkAnalyserRate(ip) {
  const now = Date.now(); const win = now - 10000;
  const hits = (RATE_HITS.get(ip) || []).filter(t => t > win);
  if (hits.length >= 20) return false;
  hits.push(now); RATE_HITS.set(ip, hits);
  return true;
}
async function analyser(req, res) {
  try {
    const { nickname, endpoint = 'stats' } = await readJson(req);
    const ip = getClientIp(req);
    if (!checkAnalyserRate(ip)) return send(res, 429, { error: 'Too many requests' });
    if (!nickname || !NICK_RE.test(nickname)) throw new Error('Invalid nickname');
    if (!ENDPOINT_ALLOWLIST.has(endpoint)) throw new Error('Endpoint not allowed');
    const analyserKey = process.env.FACEIT_ANALYSER_API_KEY;
    if (!analyserKey) throw new Error('FACEIT_ANALYSER_API_KEY not configured');
    const response = await fetch(`https://faceitanalyser.com/api/${endpoint}/${encodeURIComponent(nickname)}?key=${analyserKey}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return send(res, 200, await response.json());
  } catch (error) {
    console.error('[analyser]', error.message);
    return send(res, 500, { error: error.message || 'Failed to fetch FaceitAnalyser data', details: String(error) });
  }
}

// ── proxy-image ──────────────────────────────────────────────────────────────
const ALLOWED_IMG_DOMAINS = ['distribution.faceit-cdn.net', 'assets.faceit-cdn.net', 'cdn.faceit.com'];
async function proxyImage(req, res, url) {
  try {
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) return send(res, 400, { error: 'Missing url parameter' });
    let parsed;
    try { parsed = new URL(imageUrl); } catch { return send(res, 400, { error: 'Invalid URL' }); }
    const ok = ALLOWED_IMG_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
    if (!ok) return send(res, 403, { error: 'Domain not allowed' });
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'image/*,*/*;q=0.8' },
    });
    if (!response.ok) return send(res, response.status, { error: 'Failed to fetch image', status: response.status });
    const buf = Buffer.from(await response.arrayBuffer());
    const ct = response.headers.get('content-type') || 'image/jpeg';
    res.writeHead(200, { ...cors, 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' });
    return res.end(buf);
  } catch (error) {
    console.error('[proxy-image]', error.message);
    return send(res, 500, { error: 'Internal server error' });
  }
}

// ── gotrue shim (auth pages used supabase-js; project gone) ──────────────────
function fakeJwt(uid) {
  const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 5;
  const p = Buffer.from(JSON.stringify({ sub: uid, aud: 'supabase', exp })).toString('base64url');
  return `${h}.${p}.shim`;
}
async function authShim(req, res, pathname) {
  if (pathname === '/auth/v1/initialize') return send(res, 200, { session: null });
  if (pathname === '/auth/v1/logout') { try { await readJson(req); } catch {} return send(res, 200, { success: true }); }
  if (pathname === '/auth/v1/user') {
    const m = (req.headers.authorization || '').match(/Bearer (\S+)/);
    if (!m) return send(res, 401, { code: 40010, error: 'No session', error_description: 'No session' });
    try {
      const payload = JSON.parse(Buffer.from(m[1].split('.')[1], 'base64url').toString());
      const { data } = await pool.query('SELECT id, email FROM public.app_users WHERE id = $1', [payload.sub]);
      if (!data[0]) return send(res, 401, { code: 40010, error: 'Bad token' });
      return send(res, 200, { user: { id: data[0].id, email: data[0].email }, session: null });
    } catch { return send(res, 401, { code: 40010, error: 'Bad token' }); }
  }
  let body; try { body = await readJson(req); } catch { return send(res, 400, { code: 40001, error: 'Bad request' }); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return send(res, 400, { code: 40001, error: 'Credentials missing', error_description: 'Credentials missing' });
  const salt = crypto.randomBytes(16);
  const hashPw = async (p) => crypto.scryptSync(p, salt, 32).toString('hex');
  async function verify(stored) {
    try {
      const [saltHex, hash] = stored.split(':');
      const s = Buffer.from(saltHex, 'hex');
      return safeEqual(crypto.scryptSync(password, s, 32).toString('hex'), hash);
    } catch { return false; }
  }
  if (pathname === '/auth/v1/signup') {
    const { data: dup } = await pool.query('SELECT id FROM public.app_users WHERE email = $1', [email]);
    if (dup.length) return send(res, 400, { code: 40006, error: 'User already exists', error_description: 'User already exists' });
    const stored = `${salt.toString('hex')}:${await hashPw(password)}`;
    const { data } = await pool.query('INSERT INTO public.app_users (email, pass_hash) VALUES ($1, $2) RETURNING id, email', [email, stored]);
    const u = data[0];
    const tok = fakeJwt(u.id);
    return send(res, 200, { user: { id: u.id, email: u.email }, session: { user: { id: u.id, email: u.email }, access_token: tok, refresh_token: tok, token_type: 'bearer', expires_in: 31536000 } });
  }
  if (pathname === '/auth/v1/password' || pathname === '/auth/v1/token') {
    const { data } = await pool.query('SELECT id, email, pass_hash FROM public.app_users WHERE email = $1', [email]);
    const u = data[0];
    if (!u || !(await verify(u.pass_hash))) return send(res, 400, { code: 4001, error: 'Invalid credentials error', error_description: 'Login attempt failed' });
    const tok = fakeJwt(u.id);
    return send(res, 200, { user: { id: u.id, email: u.email }, session: { user: { id: u.id, email: u.email }, access_token: tok, refresh_token: tok, token_type: 'bearer', expires_in: 31536000 } });
  }
  return send(res, 404, { error: 'Not found' });
}

// ── router ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const p = url.pathname;
  if (req.method === 'OPTIONS') return send(res, 204, null);
  if (p === '/health') { try { await pool.query('SELECT 1'); return send(res, 200, { ok: true, db: 'up' }); } catch (e) { return send(res, 500, { ok: false, db: e.message }); } }
  try {
    if (p === '/functions/v1/friends-gateway') return await friendsGateway(req, res);
    if (p === '/functions/v1/proxy-faceit') return await proxyFaceit(req, res);
    if (p === '/functions/v1/get-faceit-analyser-data') return await analyser(req, res);
    if (p === '/functions/v1/proxy-image') return await proxyImage(req, res, url);
    if (p.startsWith('/auth/v1/')) return await authShim(req, res, p);
    return send(res, 404, { error: 'Not found: ' + p });
  } catch (e) {
    console.error('[server]', e.message);
    if (!res.headersSent) send(res, 500, { error: e.message });
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`faceit-functions on 127.0.0.1:${PORT}`));
