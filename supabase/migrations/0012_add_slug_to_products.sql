-- =========================================
-- Migration: 0012_add_slug_to_products.sql
-- Add slug field for SEO-friendly URLs
-- =========================================

-- 1. Add slug column as nullable first
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Populate slug from title (basic slugification)
-- Note: This is a best-effort for existing rows.
-- We use a simple replacement for spaces and lowercase.
UPDATE products SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 3. Make slug NOT NULL and add Unique constraint
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT products_tenant_id_slug_key UNIQUE (tenant_id, slug);

-- 4. Create Index for faster lookup
CREATE INDEX IF NOT EXISTS products_slug_idx ON products (tenant_id, slug);

-- 5. Update RLS (already covers all columns via FOR ALL, but good to keep in mind)
-- No changes needed to RLS as we use FOR ALL in 0011.
