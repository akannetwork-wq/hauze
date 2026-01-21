-- =========================================
-- Migration: 0022_wms_module.sql
-- Description: Warehouse Management System (WMS) schema
-- =========================================

-- 1. Warehouse Locations (Granular locations within a pool/warehouse)
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    pool_id UUID REFERENCES inventory_pools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'storage' CHECK (type IN ('storage', 'picking', 'shipping', 'receiving')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pool_id, name)
);

-- 2. WMS Stock (Location-based stock tracking)
CREATE TABLE IF NOT EXISTS wms_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE NOT NULL,
    quantity_on_hand DECIMAL(12,2) DEFAULT 0 NOT NULL,
    quantity_reserved DECIMAL(12,2) DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, location_id)
);

-- 3. Stock Movements (History and Ledger)
CREATE TABLE IF NOT EXISTS wms_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    from_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    reference_type TEXT, -- 'order', 'purchase', 'manual', 'production'
    reference_id UUID,
    description TEXT,
    created_by UUID, -- auth.uid()
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Shipments (Order fulfillment tracking)
CREATE TABLE IF NOT EXISTS wms_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picking', 'packed', 'shipped', 'delivered', 'cancelled')),
    carrier TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_shipments ENABLE ROW LEVEL SECURITY;

-- Standard Isolation Policies
CREATE POLICY "Tenant Isolation" ON warehouse_locations FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = warehouse_locations.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON wms_stock FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = wms_stock.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON wms_stock_movements FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = wms_stock_movements.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON wms_shipments FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = wms_shipments.tenant_id)
);
