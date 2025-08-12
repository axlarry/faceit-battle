-- Fix friends unique constraint to allow multiple owners per player
-- 1) Drop old unique constraint on player_id
ALTER TABLE public.friends
  DROP CONSTRAINT IF EXISTS friends_player_id_key;

-- 2) Add composite unique constraint on (owner_id, player_id)
ALTER TABLE public.friends
  ADD CONSTRAINT friends_owner_player_unique UNIQUE (owner_id, player_id);

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_friends_owner_id ON public.friends (owner_id);
CREATE INDEX IF NOT EXISTS idx_friends_player_id ON public.friends (player_id);
