-- =========================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================

-- Products
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX idx_products_status ON public.products(is_available);
CREATE INDEX idx_products_search ON public.products USING GIN (search_tags);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = true;

-- Product Variants
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);

-- Product Images
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- Categories & Subcategories
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_subcategories_slug ON public.subcategories(slug);
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);

-- Orders
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Users & Addresses
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- Coupons
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active, expiry_date);

-- Wallet & Notifications
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);

-- Homepage & CMS
CREATE INDEX idx_homepage_banners_section_id ON public.homepage_banners(section_id);
CREATE INDEX idx_cms_pages_slug ON public.cms_pages(slug);

-- =========================================================
-- VIEWS FOR ANALYTICS
-- =========================================================

-- Daily Sales View
CREATE OR REPLACE VIEW public.vw_daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(id) as total_orders,
    SUM(grand_total) as total_revenue,
    SUM(discount_amount) as total_discounts
FROM public.orders
WHERE status NOT IN ('Cancelled', 'Returned')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Top Selling Products View
CREATE OR REPLACE VIEW public.vw_top_selling_products AS
SELECT 
    p.id,
    p.name,
    c.name as category_name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.total_price) as total_revenue
FROM public.order_items oi
JOIN public.products p ON oi.product_id = p.id
JOIN public.categories c ON p.category_id = c.id
JOIN public.orders o ON oi.order_id = o.id
WHERE o.status NOT IN ('Cancelled', 'Returned')
GROUP BY p.id, p.name, c.name
ORDER BY total_sold DESC;

-- Low Stock Alert View
CREATE OR REPLACE VIEW public.vw_low_stock_products AS
SELECT 
    id,
    name,
    sku,
    stock,
    minimum_stock,
    'Main Product' as variant_type
FROM public.products
WHERE stock <= minimum_stock AND is_available = true
UNION ALL
SELECT 
    pv.id,
    p.name || ' - ' || pv.name as name,
    pv.sku,
    pv.stock,
    p.minimum_stock,
    'Variant' as variant_type
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
WHERE pv.stock <= p.minimum_stock AND p.is_available = true;
