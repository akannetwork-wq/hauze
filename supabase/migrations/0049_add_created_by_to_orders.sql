-- Migration: 0049_add_created_by_to_orders.sql
-- Description: Add created_by column to orders table for auditing

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Optional: Add index for performance if needed
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
