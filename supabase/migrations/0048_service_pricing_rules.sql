-- 0048_service_pricing_rules.sql

-- 1. Add service_config to products for storing dynamic fields and formulas
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS service_config JSONB DEFAULT '{}'::jsonb;

-- 2. Add type to orders to distinguish between Sales, Purchase, and Service orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'sales'; -- 'sales', 'purchase', 'service'

-- 3. Add metadata/config snapshot to order_items to store selected service options
-- Assuming order_items exists from bridge schema or similar
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS service_values JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 4. RLS for safety (already mostly covered by tenant isolation, but ensure column access)
-- No special RLS needed if logic is in app layer, but good to have comments
COMMENT ON COLUMN public.products.service_config IS '{ "inputs": [...], "rules": [...] } definition for smart pricing';
COMMENT ON COLUMN public.orders.type IS 'sales, purchase, or service order classification';
