-- =========================================================
-- PRODUCTION POLISH MIGRATION
-- =========================================================

-- 1. PRODUCT LABELS
CREATE TABLE public.product_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#10B981', -- Hex color, default emerald
    icon TEXT, -- Lucide icon name
    priority INTEGER DEFAULT 0, -- Higher priority shows first
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCT LABEL RELATIONS
CREATE TABLE public.product_label_relations (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.product_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, label_id)
);

-- 3. CATEGORY ENHANCEMENTS
ALTER TABLE public.categories
ADD COLUMN banner TEXT,
ADD COLUMN background TEXT,
ADD COLUMN gradient TEXT;

-- 4. SEED DEFAULT LABELS
INSERT INTO public.product_labels (name, color, icon, priority) VALUES
('Fresh', '#22C55E', 'leaf', 10),
('Premium', '#EAB308', 'star', 9),
('Organic', '#16A34A', 'sprout', 8),
('New', '#3B82F6', 'sparkles', 7),
('Trending', '#EC4899', 'trending-up', 6),
('Best Seller', '#F59E0B', 'award', 5),
('Recommended', '#8B5CF6', 'thumbs-up', 4),
('Limited Stock', '#EF4444', 'clock', 3),
('Flash Sale', '#DC2626', 'zap', 2),
('Today''s Deal', '#F97316', 'tag', 1)
ON CONFLICT (name) DO NOTHING;

-- 5. MIGRATE EXISTING TEXT LABELS (If any exist in the TEXT[] array we created earlier)
-- Note: Assuming the TEXT[] labels column is dropped in the future. We'll leave it for now to prevent breaking changes while we migrate the frontend.
