-- Extend friends table with cached display fields so every page load can
-- render cover images, country flags and ranking data instantly without
-- waiting for external API calls.

ALTER TABLE public.friends
  ADD COLUMN IF NOT EXISTS cover_image      TEXT,
  ADD COLUMN IF NOT EXISTS country          TEXT,
  ADD COLUMN IF NOT EXISTS country_flag     TEXT,
  ADD COLUMN IF NOT EXISTS region           TEXT,
  ADD COLUMN IF NOT EXISTS region_ranking   INTEGER,
  ADD COLUMN IF NOT EXISTS country_ranking  INTEGER,
  ADD COLUMN IF NOT EXISTS last_cached_at   TIMESTAMPTZ;

-- Index to let the gateway quickly filter by player_id during cache writes
CREATE INDEX IF NOT EXISTS idx_friends_player_id
  ON public.friends (player_id);
