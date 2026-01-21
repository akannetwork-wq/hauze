-- Add unit column to products table for consumables and materials
ALTER TABLE products ADD COLUMN unit VARCHAR(50);

-- Ensure the type column supports 'product', 'consumable', and 'service'
-- Based on previous status, we renamed 'service' to 'consumable' in 0017
-- Now we want to officially support all three if they are used.
-- Since there's no ENUM or strict CHECK yet, we can just proceed.
-- If there are any previous records that need cleanup, we handle them here.
