-- =========================================
-- Migration: 0033_order_payment_tracking.sql
-- Description: Add payment_status and payment_method to orders
-- =========================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('eft', 'cash', 'credit_card', 'check'));
