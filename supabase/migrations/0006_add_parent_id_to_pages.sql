-- Add parent_id to pages table for hierarchy
ALTER TABLE pages
ADD COLUMN parent_id UUID REFERENCES pages(id) ON DELETE SET NULL;

-- Index for performance when fetching children
CREATE INDEX idx_pages_parent_id ON pages(parent_id);

-- Check policy updates?
-- Existing policies cover standard CRUD, parent_id is just a column, so no RLS change needed if RLS is on table level.
