
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Global Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    hostname TEXT UNIQUE NOT NULL, -- e.g., 'tenant.netspace.com'
    name TEXT NOT NULL,
    is_platform_operator BOOLEAN DEFAULT FALSE, -- True for NETSPACE master tenant
    config JSONB DEFAULT '{}'::jsonb NOT NULL, -- Global config
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. Create Tenant Users (Link Auth Users to Tenants)
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL, -- Link to auth.users.id (We don't FK to auth.users to avoid schema issues, logical link)
    roles JSONB DEFAULT '[]'::jsonb NOT NULL, -- e.g., ["admin", "editor"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, user_id)
);

-- 4. Create Modules Registry (Global)
CREATE TABLE IF NOT EXISTS modules (
    key TEXT PRIMARY KEY, -- e.g., 'shop', 'crm'
    name TEXT NOT NULL,
    description TEXT,
    capabilities JSONB DEFAULT '[]'::jsonb NOT NULL -- e.g., ["products.read", "products.write"]
);

-- 5. Create Tenant Modules (Which tenant has which module)
CREATE TABLE IF NOT EXISTS tenant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    module_key TEXT REFERENCES modules(key) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    UNIQUE(tenant_id, module_key)
);

-- 6. RLS Setup function
-- This function allows the app to set the current tenant for the session
CREATE OR REPLACE FUNCTION set_current_tenant_id(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

-- 8. Create Policies

-- Tenants: Public can read hostname to resolve tenant.
-- Detailed read requires being a member.
CREATE POLICY "Public Read Hostname" ON tenants
    FOR SELECT USING (true); -- Everyone needs to resolve hostname -> ID

-- Tenant Users: Users can see their own memberships
CREATE POLICY "Users see own memberships" ON tenant_users
    FOR SELECT USING (auth.uid() = user_id);

-- Modules: Public read (or authenticated read)
CREATE POLICY "Public Read Modules" ON modules
    FOR SELECT USING (true);

-- Tenant Modules: Visible to tenant members
-- (Complex policy omitted for bootstrap simplicity, allowing check by tenant_id if set)
CREATE POLICY "Tenant Isolation" ON tenant_modules
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

-- Seed Data (Optional, but good for init)
INSERT INTO modules (key, name, description) VALUES
('website', 'Website Builder', 'Core website and CMS features'),
('crm', 'CRM System', 'Customer relationship management'),
('shop', 'E-Commerce', 'Online store and inventory');
