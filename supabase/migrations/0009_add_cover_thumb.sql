-- =========================================
-- Migration: 0009_add_cover_thumb.sql
-- Add cover_thumb column to pages table
-- =========================================

ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS cover_thumb TEXT DEFAULT NULL;

COMMENT ON COLUMN pages.cover_thumb IS 'URL to the page cover thumbnail image';
