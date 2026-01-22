-- Migration 0035: Report Cache System
-- Purpose: Store pre-calculated heavy report data to avoid runtime calculations.

CREATE TABLE report_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, report_name)
);

-- Enable RLS
ALTER TABLE report_cache ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Tenant Isolation" ON report_cache
FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM tenant_users 
        WHERE tenant_id = report_cache.tenant_id
    )
);
