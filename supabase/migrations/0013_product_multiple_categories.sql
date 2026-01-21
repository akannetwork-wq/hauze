-- =========================================
-- Migration: 0013_product_multiple_categories.sql
-- Support multiple categories per product
-- =========================================

-- 1. Create Junction Table
CREATE TABLE IF NOT EXISTS product_category_rels (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (product_id, category_id)
);

-- 2. Migrate existing category_id to junction table
INSERT INTO product_category_rels (product_id, category_id)
SELECT id, category_id FROM products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Enable RLS
ALTER TABLE product_category_rels ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies (consistent with other tables)
CREATE POLICY "Tenant Isolation" ON product_category_rels
FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE tenant_id = (SELECT tenant_id FROM products WHERE id = product_id))
    -- Actually, simpler:
    -- EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
);

-- Refined policy for performance and correctness
DROP POLICY IF EXISTS "Tenant Isolation" ON product_category_rels;
CREATE POLICY "Tenant Isolation" ON product_category_rels
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN tenant_users tu ON tu.tenant_id = p.tenant_id
        WHERE p.id = product_category_rels.product_id
        AND tu.user_id = auth.uid()
    )
);

-- 5. Add Index for performance
CREATE INDEX IF NOT EXISTS product_category_rels_product_id_idx ON product_category_rels(product_id);
CREATE INDEX IF NOT EXISTS product_category_rels_category_id_idx ON product_category_rels(category_id);

-- Note: We keep products.category_id for now to avoid breaking existing queries immediately, 
-- but we will rely on product_category_rels for the UI.
