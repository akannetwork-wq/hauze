-- Rename 'service' type to 'consumable' for better inventory management
UPDATE products 
SET type = 'consumable' 
WHERE type = 'service';

-- Ensure type check constraint is updated if it exists (assuming it was a simple check or none)
-- If there was a check constraint like: CHECK (type IN ('product', 'service'))
-- We would need to drop and re-create it. 
-- Based on migration 0010, there was no specific CHECK constraint on type, 
-- but it's good practice to keep the data consistent.
