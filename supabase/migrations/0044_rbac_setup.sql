-- 0044_rbac_setup.sql

-- 1. Add role and permissions columns to tenant_users
ALTER TABLE tenant_users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 2. Update existing users to be 'super_admin' 
-- We promote everyone existing to 'super_admin' so they don't lose access.
-- We check for NULL or 'user' to be absolutely safe.
UPDATE tenant_users
SET role = 'super_admin'
WHERE role IS NULL OR role = 'user' OR role = '';

-- 3. Add constraint for valid roles (optional but good for data integrity)
-- ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_role_check CHECK (role IN ('super_admin', 'admin', 'user'));

-- 4. Fix RLS Recursion and Permissions
-- To avoid infinite recursion, we use a SECURITY DEFINER function to check roles
CREATE OR REPLACE FUNCTION public.check_is_tenant_admin(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = t_id
    AND user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Tenant Admins can manage members" ON tenant_users;
CREATE POLICY "Tenant Admins can manage members" ON tenant_users
    FOR ALL USING (
        (auth.uid() = user_id) OR (public.check_is_tenant_admin(tenant_id))
    );
