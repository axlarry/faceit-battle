-- schema replicǎ supabase migrations 20250910214150 + 20260330010749
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  player_id text NOT NULL,
  nickname text,
  avatar text,
  level integer DEFAULT 0,
  elo integer DEFAULT 0,
  wins integer DEFAULT 0,
  win_rate double precision,
  hs_rate double precision,
  kd_ratio double precision,
  cover_image text,
  country text,
  country_flag text,
  region text,
  region_ranking integer,
  country_ranking integer,
  last_cached_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (owner_id, player_id)
);
CREATE INDEX IF NOT EXISTS idx_friends_owner_elo ON public.friends (owner_id, elo DESC);
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  pass_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
