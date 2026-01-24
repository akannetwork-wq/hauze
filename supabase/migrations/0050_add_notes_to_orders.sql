-- Migration: 0050_add_notes_to_orders.sql
-- Description: Add notes column to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;
