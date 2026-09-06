-- =========================================================
-- CASCADE CATEGORY VISIBILITY TO PRODUCTS & ENFORCE HOMEPAGE SECTION INTEGRITY
-- =========================================================

-- 1. Index on categories.is_visible for high-performance joins and subqueries
CREATE INDEX IF NOT EXISTS idx_categories_is_visible ON public.categories(is_visible);

-- 2. Drop legacy product select policy
DROP POLICY IF EXISTS "Public can view available products" ON public.products;

-- 3. Create clean cascading RLS policy on public.products:
-- Products are only returned to public/anonymous/customer queries if:
--   a) The product itself is available (is_available = true)
--   b) AND its parent category is visible (is_visible = true)
CREATE POLICY "Public can view available products" ON public.products
FOR SELECT USING (
    is_available = true
    AND EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = products.category_id AND c.is_visible = true
    )
);

-- 4. Enforce that homepage_sections data_config must have a valid non-empty category_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_homepage_section_category_id_required'
    ) THEN
        ALTER TABLE public.homepage_sections 
        ADD CONSTRAINT check_homepage_section_category_id_required 
        CHECK (
            data_config IS NOT NULL 
            AND (data_config->>'category_id') IS NOT NULL 
            AND length(trim(data_config->>'category_id')) > 0
        );
    END IF;
END $$;

-- 5. Create unified, secure helper view for customer queries
DROP VIEW IF EXISTS public.vw_active_catalog CASCADE;
CREATE OR REPLACE VIEW public.vw_active_catalog AS
SELECT 
    p.*,
    c.name AS category_name,
    c.slug AS category_slug,
    c.sort_order AS category_sort_order,
    sc.name AS subcategory_name,
    sc.slug AS subcategory_slug
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.subcategories sc ON p.subcategory_id = sc.id
WHERE p.is_available = true
  AND c.is_visible = true
  AND (sc.id IS NULL OR sc.is_visible = true);

-- Grant select on view to anon and authenticated roles
GRANT SELECT ON public.vw_active_catalog TO anon, authenticated;
