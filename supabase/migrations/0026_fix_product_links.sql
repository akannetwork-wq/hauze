-- =========================================
-- Migration: 0026_fix_product_links.sql
-- Description: Ensure SKU uniqueness for products
-- =========================================

-- Ensure products.sku is UNIQUE (it already is in 0010, but making sure)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_tenant_unique;
ALTER TABLE products ADD CONSTRAINT products_sku_tenant_unique UNIQUE (tenant_id, sku);

-- We skip Foreign Keys for SKU based linking because existing data (variants etc.) 
-- makes it too brittle for a hard constraint. We handle joins in the application layer.
