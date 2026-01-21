-- Migration 0014: Product Variations & Digital Goods support

-- 1. Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku text NOT NULL,
    title text NOT NULL, -- e.g. "iPhone 15 Pro - 256GB - Blue"
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL, -- e.g. {"Capacity": "256GB", "Color": "Blue"}
    price numeric(12,2), -- Optional: Override parent price
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Unique SKU per tenant
    UNIQUE(tenant_id, sku)
);

-- 2. Add variant_id to inventory_items table for variant-level stock tracking
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- 3. Product Digital Metadata
CREATE TABLE IF NOT EXISTS public.product_digital_meta (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    file_url text,
    download_limit integer,
    expiry_days integer,
    access_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. RLS Policies

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_digital_meta ENABLE ROW LEVEL SECURITY;

-- Product Variants Policies
CREATE POLICY "Tenant Isolation"
    ON public.product_variants
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.tenant_users WHERE tenant_id = product_variants.tenant_id));

-- Product Digital Meta Policies
CREATE POLICY "Tenant Isolation"
    ON public.product_digital_meta
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.tenant_users WHERE tenant_id = product_digital_meta.tenant_id));

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON public.inventory_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_digital_meta_product_id ON public.product_digital_meta(product_id);
