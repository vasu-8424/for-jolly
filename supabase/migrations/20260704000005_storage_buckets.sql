-- =========================================================
-- STORAGE BUCKETS & RLS POLICIES
-- =========================================================

-- Create Buckets (ignore if they already exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('categories', 'categories', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cms', 'cms', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('notifications', 'notifications', true) ON CONFLICT (id) DO NOTHING;

-- Note: RLS is enabled by default on storage.objects in Supabase.
-- Attempting to alter it as a non-owner will throw an ERROR: 42501: must be owner of table objects.

-- =========================================================
-- ADMIN POLICIES (Full Access to all buckets)
-- =========================================================
CREATE POLICY "Admin full access on objects" 
ON storage.objects FOR ALL 
USING (public.is_admin());

-- =========================================================
-- PUBLIC POLICIES (Read Access for Public Buckets)
-- =========================================================
CREATE POLICY "Public can view products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public can view categories" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
CREATE POLICY "Public can view banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Public can view cms images" ON storage.objects FOR SELECT USING (bucket_id = 'cms');
CREATE POLICY "Public can view notifications images" ON storage.objects FOR SELECT USING (bucket_id = 'notifications');
CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- =========================================================
-- CUSTOMER POLICIES (Avatars)
-- =========================================================
-- Users can upload their own avatars
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
