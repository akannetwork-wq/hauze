-- =========================================
-- Migration: 0032_add_metadata_to_transactions.sql
-- Description: Add metadata column to transactions table
-- =========================================

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
