-- ==============================================================================
-- Migration: 20260906000003_sync_product_oos_labels.sql
-- Description: Automatically synchronize 'outofstock' label with force_out_of_stock
-- ==============================================================================

-- 1. Synchronize existing products that have force_out_of_stock = true
UPDATE public.products
SET labels = ARRAY(
    SELECT DISTINCT unnest(array_append(COALESCE(labels, ARRAY[]::text[]), 'outofstock'))
)
WHERE force_out_of_stock = true
  AND NOT ('outofstock' = ANY(COALESCE(labels, ARRAY[]::text[])));

-- 2. Trigger function to keep force_out_of_stock and 'outofstock' label in sync
CREATE OR REPLACE FUNCTION public.sync_product_oos_labels()
RETURNS TRIGGER AS $$
DECLARE
    cleaned_labels text[];
    lbl text;
    has_oos boolean := false;
BEGIN
    cleaned_labels := ARRAY[]::text[];
    
    IF NEW.labels IS NOT NULL THEN
        FOREACH lbl IN ARRAY NEW.labels LOOP
            IF lower(lbl) = 'outofstock' OR lower(lbl) = 'out of stock' OR lower(lbl) = 'out_of_stock' THEN
                has_oos := true;
            ELSE
                cleaned_labels := array_append(cleaned_labels, lbl);
            END IF;
        END LOOP;
    END IF;

    IF NEW.force_out_of_stock = true OR has_oos = true THEN
        NEW.force_out_of_stock := true;
        NEW.labels := array_append(cleaned_labels, 'outofstock');
    ELSE
        NEW.force_out_of_stock := false;
        NEW.labels := cleaned_labels;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_oos_labels ON public.products;

CREATE TRIGGER trg_sync_product_oos_labels
BEFORE INSERT OR UPDATE OF force_out_of_stock, labels ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_oos_labels();
