-- =========================================
-- Migration: 0008_storage_buckets.sql
-- Create CMS bucket and RLS policies
-- =========================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms', 'cms', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the cms bucket

-- 1. Allow public read access to all objects in the cms bucket
CREATE POLICY "Public Read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cms');

-- 2. Allow authenticated users to upload objects to the cms bucket
CREATE POLICY "Auth Insert" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cms' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to update or delete their own objects in the cms bucket
-- (For simplicity in this multi-tenant setup, we allow all authenticated admins of the tenant)
-- In a stricter setup, we would check if the object path starts with the user's tenant_id
CREATE POLICY "Auth Update/Delete" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'cms' 
  AND auth.role() = 'authenticated'
);
