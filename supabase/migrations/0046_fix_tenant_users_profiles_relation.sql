-- 0046_fix_tenant_users_profiles_relation.sql

-- 1. Ensure profiles are backfilled FIRST
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Remove orphaned tenant_users that don't have a corresponding profile/auth-user
DELETE FROM public.tenant_users 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 3. Add explicit link between tenant_users and profiles
ALTER TABLE IF EXISTS public.tenant_users
DROP CONSTRAINT IF EXISTS tenant_users_user_id_fkey;

ALTER TABLE public.tenant_users
ADD CONSTRAINT tenant_users_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
