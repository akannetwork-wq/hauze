
-- 1. Inventory Pools (Warehouses, Virtual Pools)
CREATE TABLE IF NOT EXISTS inventory_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    key TEXT NOT NULL, -- e.g. 'main-warehouse'
    strategy TEXT DEFAULT 'stock', -- 'stock', 'time-slot', 'date-range'
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, key)
);

-- 2. Inventory Items (The actual counter)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    pool_id UUID REFERENCES inventory_pools(id) ON DELETE CASCADE NOT NULL,
    sku TEXT NOT NULL, 
    state JSONB DEFAULT '{}'::jsonb NOT NULL, -- { "on_hand": 100, "reserved": 5 } OR { "2024-01-01": "booked" }
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, pool_id, sku)
);

-- 3. Prices (Decoupled from Product Content)
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    sku TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    list_key TEXT DEFAULT 'standard', -- 'retail', 'wholesale'
    rules JSONB DEFAULT '{}'::jsonb NOT NULL,
    UNIQUE(tenant_id, sku, list_key, currency)
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID, -- Optional foreign key to CRM (soft link usually prefered if CRM is modular)
    status TEXT DEFAULT 'pending' NOT NULL,
    currency TEXT NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    lines JSONB DEFAULT '[]'::jsonb NOT NULL, -- snapshot of what was bought
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE inventory_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Standard Isolation Policy
CREATE POLICY "Tenant Isolation" ON inventory_pools FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Tenant Isolation" ON inventory_items FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Tenant Isolation" ON prices FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Tenant Isolation" ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
