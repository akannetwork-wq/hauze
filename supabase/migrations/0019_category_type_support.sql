-- =========================================
-- Migration: 0019_category_type_support.sql
-- Description: Add 'type' to product_categories for tri-tier separation
-- =========================================

-- 1. Add type column with default 'product'
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'product';

-- 2. Update UNIQUE constraint to include type
-- First, drop the old constraint if we can identify it, or just add a new one if preferred.
-- In migration 0010 it was UNIQUE(tenant_id, slug).
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_tenant_id_slug_key;
ALTER TABLE product_categories ADD CONSTRAINT product_categories_tenant_id_slug_type_key UNIQUE (tenant_id, slug, type);

-- 3. Add index for performance on type filtering
CREATE INDEX IF NOT EXISTS idx_product_categories_type ON product_categories(tenant_id, type);

COMMENT ON COLUMN product_categories.type IS 'Distinguishes between product, consumable, and service category trees.';
