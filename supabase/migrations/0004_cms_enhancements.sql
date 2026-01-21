-- CMS Enhancements for Pages table

-- 1. Add menu_location enum support (stored as text for flexibility, but verified by UI)
ALTER TABLE pages 
ADD COLUMN menu_location TEXT DEFAULT 'main', -- 'main', 'footer', 'sub', 'hidden'
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 2. Add locales support for multi-language
-- Stores localized strings like: { "tr": { "title": "...", "slug": "..." }, "en": { ... } }
ALTER TABLE pages
ADD COLUMN locales JSONB DEFAULT '{}'::jsonb;

-- 3. Add index for faster menu lookups
CREATE INDEX idx_pages_menu_location ON pages(tenant_id, menu_location, sort_order);
