
-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    path TEXT NOT NULL, -- e.g. '/about'
    title TEXT NOT NULL,
    template_key TEXT NOT NULL, -- e.g. 'standard', 'landing'
    sections JSONB DEFAULT '[]'::jsonb NOT NULL,
    seo JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, path)
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON pages
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

CREATE POLICY "Public Read Published" ON pages
    FOR SELECT USING (
        is_published = true
        -- AND tenant_id matches... (Handled by RLS if app sets context for public site too, or bypassed)
        -- For public site, we might need a separate function or use anon key with explicit tenant filter
    );
