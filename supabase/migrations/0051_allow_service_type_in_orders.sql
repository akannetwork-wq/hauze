-- Migration: 0051_allow_service_type_in_orders.sql
-- Description: Update the check constraint on the orders table type column to allow 'service' type.

ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_type_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_type_check CHECK (type IN ('sale', 'purchase', 'service'));
