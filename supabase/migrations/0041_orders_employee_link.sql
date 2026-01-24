-- Migration: 0041_orders_employee_link.sql
-- Description: Add employee_id to orders to allow personnel trading

DO $$ 
BEGIN
    -- 1. Add employee_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
    END IF;

    -- 2. Add Index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_employee'
    ) THEN
        CREATE INDEX idx_orders_employee ON orders(tenant_id, employee_id);
    END IF;
END $$;
