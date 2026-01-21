-- =========================================
-- Migration: 0030_formalize_order_relationships.sql
-- Description: Add foreign key constraints to orders table
-- =========================================

-- 1. Add foreign key to contacts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_contact_id_fkey'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_contact_id_fkey 
        FOREIGN KEY (contact_id) 
        REFERENCES contacts(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Add foreign key to inventory_pools if it doesn't exist (it should from 0025 but being safe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_warehouse_id_fkey'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_warehouse_id_fkey 
        FOREIGN KEY (warehouse_id) 
        REFERENCES inventory_pools(id) 
        ON DELETE SET NULL;
    END IF;
END $$;
