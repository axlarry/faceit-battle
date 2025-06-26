
-- Șterge politica UPDATE duplicată rămasă
DROP POLICY IF EXISTS "Enable update for all users" ON public.friends;
