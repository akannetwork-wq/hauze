-- Add is_system column to tenants table to identify the platform owner tenant
ALTER TABLE tenants ADD COLUMN is_system BOOLEAN DEFAULT FALSE;

-- Mark existing NETSPACE tenant as system
UPDATE tenants SET is_system = TRUE WHERE name = 'NETSPACE';
