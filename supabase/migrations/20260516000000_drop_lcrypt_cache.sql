-- Drop lcrypt_cache table and its cleanup function
-- lcrypt.eu has been eliminated; this data is no longer written or needed
DROP TABLE IF EXISTS public.lcrypt_cache;
DROP FUNCTION IF EXISTS public.clean_expired_lcrypt_cache();
