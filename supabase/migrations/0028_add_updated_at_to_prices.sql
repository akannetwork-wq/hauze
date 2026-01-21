-- Migration: 0028_add_updated_at_to_prices.sql
-- Add updated_at column to prices table

ALTER TABLE prices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
