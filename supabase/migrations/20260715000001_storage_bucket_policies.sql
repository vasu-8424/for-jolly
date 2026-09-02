-- =========================================================
-- STORAGE BUCKETS & RLS POLICIES FOR SUPABASE
-- =========================================================

-- 1. Ensure all required storage buckets exist and are marked public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml']),
  ('categories', 'categories', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml']),
  ('banners', 'banners', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml']),
  ('avatars', 'avatars', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml']),
  ('cms', 'cms', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml']),
  ('notifications', 'notifications', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 15728640;

-- 2. Drop any conflicting storage policies if they exist
DROP POLICY IF EXISTS "Public can view products" ON storage.objects;
DROP POLICY IF EXISTS "Public can view categories" ON storage.objects;
DROP POLICY IF EXISTS "Public can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view cms images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view notifications images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access on objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated and service role uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- 3. Public Read Access for all storage buckets
CREATE POLICY "Public Access to Buckets" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('products', 'categories', 'banners', 'cms', 'notifications', 'avatars'));

-- 4. Allow uploads and mutations (bypassed automatically by service_role, allowed for all authenticated/app clients)
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('products', 'categories', 'banners', 'cms', 'notifications', 'avatars'));

CREATE POLICY "Allow public updates" 
ON storage.objects FOR UPDATE 
USING (bucket_id IN ('products', 'categories', 'banners', 'cms', 'notifications', 'avatars'));

CREATE POLICY "Allow public deletes" 
ON storage.objects FOR DELETE 
USING (bucket_id IN ('products', 'categories', 'banners', 'cms', 'notifications', 'avatars'));
