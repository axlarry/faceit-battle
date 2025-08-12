-- Ensure friends.owner_id is set on insert and immutable on update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'friends_owner_id_guard'
  ) THEN
    CREATE TRIGGER friends_owner_id_guard
    BEFORE INSERT OR UPDATE ON public.friends
    FOR EACH ROW
    EXECUTE FUNCTION public.friends_set_owner_id();
  END IF;
END$$;