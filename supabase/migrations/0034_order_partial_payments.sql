-- =========================================
-- Migration: 0034_order_partial_payments.sql
-- Description: Add paid_amount and update payment_status constraint
-- =========================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL;

-- Update constraint to allow 'partial'
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'partial', 'paid'));
