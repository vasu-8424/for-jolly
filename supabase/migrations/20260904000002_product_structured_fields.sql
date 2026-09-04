-- ==============================================================================
-- AERVO APP / KAKINADA FRESH: STRUCTURED PRODUCT FIELDS, PREP OPTIONS, EXTRAS & RECIPES
-- ==============================================================================

-- 1. Add structured fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'info_fields'
  ) THEN
    ALTER TABLE public.products ADD COLUMN info_fields JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'prep_options'
  ) THEN
    ALTER TABLE public.products ADD COLUMN prep_options JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'extra_options'
  ) THEN
    ALTER TABLE public.products ADD COLUMN extra_options JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'recipes'
  ) THEN
    ALTER TABLE public.products ADD COLUMN recipes JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Add selection snapshots to order_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'selected_prep_option'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN selected_prep_option JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'selected_extras'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN selected_extras JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'info_snapshot'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN info_snapshot JSONB;
  END IF;
END $$;
