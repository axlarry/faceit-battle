
-- Șterge toate politicile existente pentru tabela friends
DROP POLICY IF EXISTS "Allow delete for all users" ON public.friends;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.friends;
DROP POLICY IF EXISTS "Everyone can delete friends" ON public.friends;
DROP POLICY IF EXISTS "Allow all users to insert friends" ON public.friends;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.friends;
DROP POLICY IF EXISTS "Everyone can add friends" ON public.friends;
DROP POLICY IF EXISTS "Allow all users to view friends" ON public.friends;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.friends;
DROP POLICY IF EXISTS "Everyone can view friends" ON public.friends;

-- Creează o singură politică pentru fiecare acțiune
CREATE POLICY "friends_select_policy" ON public.friends
    FOR SELECT USING (true);

CREATE POLICY "friends_insert_policy" ON public.friends
    FOR INSERT WITH CHECK (true);

CREATE POLICY "friends_update_policy" ON public.friends
    FOR UPDATE USING (true);

CREATE POLICY "friends_delete_policy" ON public.friends
    FOR DELETE USING (true);
