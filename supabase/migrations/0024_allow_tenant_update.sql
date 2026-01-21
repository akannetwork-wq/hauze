-- =========================================
-- Migration: 0024_allow_tenant_update.sql
-- Description: Allow tenant members to update their tenant config and register personnel module
-- =========================================

-- 1. Add Update Policy to Tenants
DROP POLICY IF EXISTS "Tenant update policy" ON tenants;
CREATE POLICY "Tenant update policy" ON tenants
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM tenant_users 
            WHERE tenant_id = tenants.id
        )
    );

-- 2. Register Personnel Module if not exists
INSERT INTO modules (key, name, description)
VALUES ('personnel', 'Personel Yönetimi', 'Çalışanlar, puantaj ve maaş yönetimi')
ON CONFLICT (key) DO NOTHING;

-- 3. Standard Selection Policy for tenant admins/members to see full tenant details
DROP POLICY IF EXISTS "Tenant members read" ON tenants;
CREATE POLICY "Tenant members read" ON tenants
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM tenant_users 
            WHERE tenant_id = tenants.id
        )
    );
