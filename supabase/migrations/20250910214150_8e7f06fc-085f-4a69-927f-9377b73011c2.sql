-- Create cache table for Lcrypt responses to reduce external API pressure
CREATE TABLE IF NOT EXISTS public.lcrypt_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Indexes for fast lookups and maintenance
CREATE UNIQUE INDEX IF NOT EXISTS idx_lcrypt_cache_nickname ON public.lcrypt_cache (nickname);
CREATE INDEX IF NOT EXISTS idx_lcrypt_cache_expires_at ON public.lcrypt_cache (expires_at);

-- Enable RLS and allow public reads only
ALTER TABLE public.lcrypt_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lcrypt_cache'
      AND policyname = 'Cache readable by everyone'
  ) THEN
    CREATE POLICY "Cache readable by everyone"
    ON public.lcrypt_cache
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Maintenance function to purge expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_lcrypt_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  DELETE FROM public.lcrypt_cache WHERE expires_at < now();
END;
$$;