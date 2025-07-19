
-- Create cache table for Faceit Analyser API data with 4-hour TTL
CREATE TABLE public.faceit_analyser_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('player_stats', 'player_graphs', 'match_analysis')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '4 hours'),
  UNIQUE(player_id, cache_type)
);

-- Add Row Level Security
ALTER TABLE public.faceit_analyser_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for friends analysis)
CREATE POLICY "Allow all operations on faceit_analyser_cache" 
  ON public.faceit_analyser_cache 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_faceit_cache_player_type ON public.faceit_analyser_cache(player_id, cache_type);
CREATE INDEX idx_faceit_cache_expires ON public.faceit_analyser_cache(expires_at);

-- Create function to automatically clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_faceit_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.faceit_analyser_cache 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
