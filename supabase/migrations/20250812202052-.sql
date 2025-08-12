-- Enforce secure RLS on friends table and remove public read access

-- Ensure RLS is enabled and enforced
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends FORCE ROW LEVEL SECURITY;

-- Drop the public SELECT policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='friends' AND policyname='Friends are readable by everyone'
  ) THEN
    DROP POLICY "Friends are readable by everyone" ON public.friends;
  END IF;
END $$;

-- Create owner-only SELECT policy if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='friends' AND policyname='Users can view their own friends'
  ) THEN
    CREATE POLICY "Users can view their own friends"
    ON public.friends
    FOR SELECT
    USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Create owner-only INSERT policy (allow NULL owner_id which will be set by trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='friends' AND policyname='Users can insert their own friends'
  ) THEN
    CREATE POLICY "Users can insert their own friends"
    ON public.friends
    FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);
  END IF;
END $$;

-- Create owner-only UPDATE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='friends' AND policyname='Users can update their own friends'
  ) THEN
    CREATE POLICY "Users can update their own friends"
    ON public.friends
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Create owner-only DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='friends' AND policyname='Users can delete their own friends'
  ) THEN
    CREATE POLICY "Users can delete their own friends"
    ON public.friends
    FOR DELETE
    USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Ensure index on owner_id exists for performance
CREATE INDEX IF NOT EXISTS idx_friends_owner_id ON public.friends(owner_id);

-- Trigger function to set owner_id on INSERT (if NULL) and prevent changes on UPDATE
CREATE OR REPLACE FUNCTION public.friends_set_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS NULL THEN
      NEW.owner_id = auth.uid();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id <> OLD.owner_id THEN
      RAISE EXCEPTION 'Cannot change owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_friends_set_owner_id'
  ) THEN
    CREATE TRIGGER trg_friends_set_owner_id
    BEFORE INSERT OR UPDATE ON public.friends
    FOR EACH ROW EXECUTE FUNCTION public.friends_set_owner_id();
  END IF;
END $$;