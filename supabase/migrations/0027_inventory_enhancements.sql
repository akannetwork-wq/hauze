-- =========================================
-- Migration: 0027_inventory_enhancements.sql
-- Description: Add flags for sales, purchase, consumable and ecommerce
-- =========================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS allow_sale BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_purchase BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_consumable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_ecommerce_active BOOLEAN DEFAULT FALSE;

-- Update list_key for prices to clarify purchase prices
-- We can use 'purchase' as a list_key in the prices table.
-- No schema change needed for prices as list_key is already TEXT.

COMMENT ON COLUMN products.allow_sale IS 'Whether the product can be sold to customers';
COMMENT ON COLUMN products.allow_purchase IS 'Whether the product can be purchased from suppliers';
COMMENT ON COLUMN products.allow_consumable IS 'Whether the product can be used in internal production/consumption';
COMMENT ON COLUMN products.is_ecommerce_active IS 'Toggle for visibility on the e-commerce storefront';
