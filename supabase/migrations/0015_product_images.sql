-- Migration 0015: Product & Variant Images support

-- 1. Add cover image columns to products table
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS cover_image text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cover_thumb text DEFAULT NULL;

COMMENT ON COLUMN public.products.cover_image IS 'URL to the main product cover/featured image';
COMMENT ON COLUMN public.products.cover_thumb IS 'URL to the product cover thumbnail image';

-- 2. Add image_url to product_variants for variant-specific photos
ALTER TABLE public.product_variants 
    ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

COMMENT ON COLUMN public.product_variants.image_url IS 'URL to a specific image for this product variant';
