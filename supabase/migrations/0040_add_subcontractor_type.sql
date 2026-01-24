-- Migration: 0040_add_subcontractor_type.sql
-- Description: Update contacts type check constraint to include 'subcontractor'

-- 1. Drop existing constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_check;

-- 2. Add new constraint including 'subcontractor'
ALTER TABLE contacts 
    ADD CONSTRAINT contacts_type_check 
    CHECK (type IN ('customer', 'supplier', 'partner', 'subcontractor'));
