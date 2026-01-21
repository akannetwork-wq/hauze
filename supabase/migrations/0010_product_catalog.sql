-- =========================================
-- Migration: 0010_product_catalog.sql
-- Add product categories and products tables
-- =========================================

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    locales JSONB DEFAULT '{}'::jsonb, -- { tr: { name, description }, en: { name, description } }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, slug)
);

-- 2. Products (Unified for Products and Services)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'product', -- 'product', 'service'
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Rich text/HTML
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    locales JSONB DEFAULT '{}'::jsonb, -- { tr: { title, description, content }, en: { title, description, content } }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, sku)
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Standard Isolation Policies
CREATE POLICY "Tenant Isolation" ON product_categories FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Tenant Isolation" ON products FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Public Read Policies (for web storefront)
-- These allow unauthenticated access to products of the current tenant
CREATE POLICY "Public Read" ON product_categories FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Public Read" ON products FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Comments
COMMENT ON TABLE product_categories IS 'Hierarchy for product and service organization';
COMMENT ON TABLE products IS 'Rich content for products and services. SKU links to prices and inventory_items tables.';
