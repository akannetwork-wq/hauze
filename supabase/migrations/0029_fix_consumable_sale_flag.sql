-- Migration: 0029_fix_consumable_sale_flag.sql
-- For consumables, the default should be non-sellable unless explicitly marked.
-- Since the previous migration 0027 defaulted everything to TRUE, we fix existing consumables here.

UPDATE products 
SET allow_sale = FALSE 
WHERE type = 'consumable' 
AND allow_sale = TRUE; 
