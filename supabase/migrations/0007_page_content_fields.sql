-- =========================================
-- Migration: 0007_page_content_fields.sql
-- Add default content fields to pages table
-- =========================================

-- Add description field (for meta description / short excerpt)
ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add rich content field (main page content in HTML)
ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';

-- Add cover image field (URL to cover/featured image)
ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT NULL;

-- Update existing locales to include new fields structure
-- The locales JSONB field already supports dynamic keys, so no schema change needed
-- Just noting that locales can now contain: { en: { title, path, description, content } }

COMMENT ON COLUMN pages.description IS 'Short description for SEO meta and page excerpts';
COMMENT ON COLUMN pages.content IS 'Main rich text content (HTML) for the page';
COMMENT ON COLUMN pages.cover_image IS 'URL to the page cover/featured image';
