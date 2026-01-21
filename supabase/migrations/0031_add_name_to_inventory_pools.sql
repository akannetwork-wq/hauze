-- =========================================
-- Migration: 0031_add_name_to_inventory_pools.sql
-- Description: Add name column to inventory_pools
-- =========================================

ALTER TABLE inventory_pools 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing pools to have a name based on key if possible
UPDATE inventory_pools 
SET name = key 
WHERE name IS NULL;
