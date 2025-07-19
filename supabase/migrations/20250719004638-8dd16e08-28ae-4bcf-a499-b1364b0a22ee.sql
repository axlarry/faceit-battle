-- Fix the search path security issue for the cache cleanup function
CREATE OR REPLACE FUNCTION public.clean_expired_faceit_cache()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.faceit_analyser_cache 
  WHERE expires_at < now();
END;
$$;