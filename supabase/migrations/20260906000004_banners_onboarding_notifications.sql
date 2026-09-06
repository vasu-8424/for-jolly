-- ==============================================================================
-- Migration: 20260906000004_banners_onboarding_notifications.sql
-- Description: Dynamic Banners, 3-Slide Onboarding Screens, Secured Device Tokens
-- ==============================================================================

-- 1. Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    link_target TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners(display_order, is_active);

-- Enable RLS on banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_select" ON public.banners;
CREATE POLICY "banners_public_select" ON public.banners
    FOR SELECT TO public
    USING (is_active = true);

DROP POLICY IF EXISTS "banners_service_role_all" ON public.banners;
CREATE POLICY "banners_service_role_all" ON public.banners
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Seed initial banners if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.banners) THEN
        INSERT INTO public.banners (image_url, title, subtitle, link_target, display_order, is_active)
        VALUES
        ('https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', 'FRESHNESS YOU CAN TRUST', 'Seafood | Chicken | Mutton | Vegetables', '/category/sea-food', 0, true),
        ('https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80', 'FRESH SEAFOOD DIRECT CATCH', 'Prawns, Fish, Crabs & Shellfish', '/category/sea-food', 1, true),
        ('https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', 'FARM FRESH VEGETABLES', 'Organic & Handpicked Daily', '/category/vegetables', 2, true);
    END IF;
END $$;


-- 2. Create onboarding_screens table (Fixed 3 slots: display_order 1, 2, 3)
CREATE TABLE IF NOT EXISTS public.onboarding_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_order INT NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_display_order ON public.onboarding_screens(display_order);

-- Enable RLS on onboarding_screens
ALTER TABLE public.onboarding_screens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_public_select" ON public.onboarding_screens;
CREATE POLICY "onboarding_public_select" ON public.onboarding_screens
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "onboarding_service_role_all" ON public.onboarding_screens;
CREATE POLICY "onboarding_service_role_all" ON public.onboarding_screens
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Seed the initial 3 onboarding slides
INSERT INTO public.onboarding_screens (display_order, image_url, title, subtitle)
VALUES
(1, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80', 'Fresh Sea Food - Catch Of The Day', 'Direct from the Bay of Bengal to your kitchen. Premium quality prawns, fish & crab delivered fresh daily.'),
(2, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80', 'Prime Cut Meat - Hygienic & Tender', '100% antibiotic-free, expertly cut chicken, mutton, and fresh meats handled with supreme safety.'),
(3, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80', 'Farm Fresh Greens - Organic Vegetables', 'Hand-picked crisp vegetables and essentials sourced directly from local organic farms every morning.')
ON CONFLICT (display_order) DO UPDATE
SET image_url = EXCLUDED.image_url,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    updated_at = now();


-- 3. Create device_tokens table (Strictly 100% service_role only)
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    fcm_token TEXT NOT NULL UNIQUE,
    platform TEXT DEFAULT 'android',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens(fcm_token);

-- Enable RLS on device_tokens
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_service_role_all" ON public.device_tokens;
CREATE POLICY "device_tokens_service_role_all" ON public.device_tokens
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Ensure notifications table indexes and RLS
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_public_select" ON public.notifications;
CREATE POLICY "notifications_public_select" ON public.notifications
    FOR SELECT TO public
    USING (user_id IS NULL OR user_id::text = (auth.uid())::text);

DROP POLICY IF EXISTS "notifications_service_role_all" ON public.notifications;
CREATE POLICY "notifications_service_role_all" ON public.notifications
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

