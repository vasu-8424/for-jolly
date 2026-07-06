-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- 1. Create Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For this Admin Panel, we consider any authenticated user as an admin.
    -- In a strict production environment, check for a specific email or role:
    -- RETURN (auth.jwt() ->> 'email' = 'admin@kakinadafresh.com');
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- ADMIN POLICIES (Full Access to Everything)
-- =========================================================
-- We can create a DO block to generate admin policies for all tables
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('CREATE POLICY "Admin full access on %I" ON public.%I FOR ALL USING (public.is_admin());', t_name, t_name);
    END LOOP;
END;
$$;

-- =========================================================
-- PUBLIC POLICIES (Anonymous / Unauthenticated)
-- =========================================================
-- Anyone can view active products, categories, etc.
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view active subcategories" ON public.subcategories FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view available products" ON public.products FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public can view homepage sections" ON public.homepage_sections FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view homepage banners" ON public.homepage_banners FOR SELECT USING (is_visible = true);
CREATE POLICY "Public can view published cms pages" ON public.cms_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Public can view business settings" ON public.business_settings FOR SELECT USING (true);
CREATE POLICY "Public can view app settings" ON public.app_settings FOR SELECT USING (true);

-- Anyone can insert a support message (contact us form)
CREATE POLICY "Public can insert support messages" ON public.support_messages FOR INSERT WITH CHECK (true);

-- =========================================================
-- CUSTOMER POLICIES (Authenticated Users)
-- =========================================================
-- Users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Addresses
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Orders & Order Items
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- Coupons
CREATE POLICY "Users can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND expiry_date > NOW());
CREATE POLICY "Users can insert coupon usage" ON public.coupon_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);

-- Wallet Transactions
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
-- Wallet transactions should typically be inserted via secure backend/Edge Functions, but if done client-side:
CREATE POLICY "Users can insert debit wallet transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id AND transaction_type = 'Debit');

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
