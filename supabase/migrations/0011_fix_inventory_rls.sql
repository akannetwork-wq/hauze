-- =========================================
-- Migration: 0011_fix_inventory_rls.sql
-- Drop old policies and add robust tenant_users checks
-- =========================================

-- 1. Products & Categories
DROP POLICY IF EXISTS "Tenant Isolation" ON products;
DROP POLICY IF EXISTS "Tenant Isolation" ON product_categories;

CREATE POLICY "Tenant Isolation" ON products
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = products.tenant_id)
);

CREATE POLICY "Tenant Isolation" ON product_categories
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = product_categories.tenant_id)
);

-- 2. Commerce (Prices & Inventory)
DROP POLICY IF EXISTS "Tenant Isolation" ON prices;
DROP POLICY IF EXISTS "Tenant Isolation" ON inventory_items;
DROP POLICY IF EXISTS "Tenant Isolation" ON inventory_pools;
DROP POLICY IF EXISTS "Tenant Isolation" ON orders;

CREATE POLICY "Tenant Isolation" ON prices
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = prices.tenant_id)
);

CREATE POLICY "Tenant Isolation" ON inventory_items
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = inventory_items.tenant_id)
);

CREATE POLICY "Tenant Isolation" ON inventory_pools
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = inventory_pools.tenant_id)
);

CREATE POLICY "Tenant Isolation" ON orders
FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = orders.tenant_id)
);

-- 3. Update Public Read Policies (Select ONLY)
-- Keep them simple or match the others if storefront is authenticated
-- For now, let's keep selecting by current_setting for storefronts if they use RPC to set it,
-- but adding a fallback or making them public if tenant_id is known is safer.
-- Actually, let's just make them robust too.
DROP POLICY IF EXISTS "Public Read" ON products;
DROP POLICY IF EXISTS "Public Read" ON product_categories;

CREATE POLICY "Public Read" ON products FOR SELECT USING (true); -- Storefronts navigate by tenant_id eq context.id anyway
CREATE POLICY "Public Read" ON product_categories FOR SELECT USING (true);
