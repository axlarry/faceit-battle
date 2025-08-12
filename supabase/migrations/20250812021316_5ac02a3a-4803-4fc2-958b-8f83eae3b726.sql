-- Lock down overly permissive RLS policies by removing "allow all" policies
-- Ensure RLS is enabled and no default-open policies exist

-- Faceit analyser cache table
ALTER TABLE IF EXISTS public.faceit_analyser_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'faceit_analyser_cache' AND policyname = 'Allow all operations on faceit_analyser_cache'
  ) THEN
    DROP POLICY "Allow all operations on faceit_analyser_cache" ON public.faceit_analyser_cache;
  END IF;
END $$;

-- Friends table
ALTER TABLE IF EXISTS public.friends ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'friends' AND policyname = 'friends_select_policy'
  ) THEN
    DROP POLICY "friends_select_policy" ON public.friends;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'friends' AND policyname = 'friends_insert_policy'
  ) THEN
    DROP POLICY "friends_insert_policy" ON public.friends;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'friends' AND policyname = 'friends_update_policy'
  ) THEN
    DROP POLICY "friends_update_policy" ON public.friends;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'friends' AND policyname = 'friends_delete_policy'
  ) THEN
    DROP POLICY "friends_delete_policy" ON public.friends;
  END IF;
END $$;

-- Note: With RLS enabled and no policies, all access is denied by default, which is the secure baseline.
