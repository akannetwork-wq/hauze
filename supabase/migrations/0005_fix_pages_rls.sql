-- Drop the old policy that relied on app.current_tenant_id
DROP POLICY IF EXISTS "Tenant Isolation" ON pages;

-- Create a robust policy based on actual membership
-- This allows Users to Insert/Update/Delete/Select pages ONLY for tenants they are members of.
CREATE POLICY "Tenant Isolation" ON pages
FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM tenant_users 
        WHERE tenant_id = pages.tenant_id
    )
);
