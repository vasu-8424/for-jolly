-- ==============================================================================
-- FEATURE: MANUAL OUT-OF-STOCK TOGGLE PER PRODUCT (PRODUCT STAYS VISIBLE)
-- ==============================================================================

-- 1. Add force_out_of_stock column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'force_out_of_stock'
  ) THEN
    ALTER TABLE public.products ADD COLUMN force_out_of_stock BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Create index on force_out_of_stock for fast querying
CREATE INDEX IF NOT EXISTS idx_products_force_out_of_stock ON public.products(force_out_of_stock);

-- 3. Update customer catalog view to include force_out_of_stock and computed is_out_of_stock
DROP VIEW IF EXISTS public.vw_active_catalog CASCADE;
CREATE OR REPLACE VIEW public.vw_active_catalog AS
SELECT 
    p.*,
    (p.force_out_of_stock = true OR p.stock <= 0) AS is_out_of_stock,
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

GRANT SELECT ON public.vw_active_catalog TO anon, authenticated;
