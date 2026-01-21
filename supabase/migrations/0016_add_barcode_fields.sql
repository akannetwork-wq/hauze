-- Migration 0016: Add barcode fields to products and variants

-- 1. Add barcode to products
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS barcode text DEFAULT NULL;

COMMENT ON COLUMN public.products.barcode IS 'Barcode for the main product (or fallback for variations)';

-- 2. Add barcode to product_variants
ALTER TABLE public.product_variants 
    ADD COLUMN IF NOT EXISTS barcode text DEFAULT NULL;

COMMENT ON COLUMN public.product_variants.barcode IS 'Specific barcode for this product variation';

-- 3. Add unique constraints per tenant (optional but recommended for barcode uniqueness)
-- Note: We might allow same barcode across different tenants, but unique within one tenant.
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON public.product_variants(tenant_id, barcode);
