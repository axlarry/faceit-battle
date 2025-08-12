-- Tighten RLS and ownership on friends table

-- Ensure RLS is enabled and enforced
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends FORCE ROW LEVEL SECURITY;

-- Drop all existing policies on friends table (safely)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='friends'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.friends', pol.policyname);
  END LOOP;
END $$;

-- Ensure owner_id cannot be null
ALTER TABLE public.friends ALTER COLUMN owner_id SET NOT NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_friends_owner_id ON public.friends(owner_id);

-- Owner-based policies
CREATE POLICY "Friends are viewable by their owners"
ON public.friends
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own friends"
ON public.friends
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own friends"
ON public.friends
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own friends"
ON public.friends
FOR DELETE
USING (auth.uid() = owner_id);

-- Trigger to set owner_id and prevent changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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