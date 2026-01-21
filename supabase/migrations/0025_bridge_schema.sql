-- =========================================
-- Migration: 0025_bridge_schema.sql
-- Description: bridge between Accounting and WMS
-- =========================================

-- 1. Update orders table for unified trade
ALTER TABLE orders 
RENAME COLUMN customer_id TO contact_id;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'sale' CHECK (type IN ('sale', 'purchase')),
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES inventory_pools(id),
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Ensure RLS is updated (already exists but for clarity)
DROP POLICY IF EXISTS "Tenant Isolation" ON orders;
CREATE POLICY "Tenant Isolation" ON orders FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = orders.tenant_id)
);
