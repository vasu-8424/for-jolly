-- Migration: Exact Customer Delivery Location (Swiggy/Zomato style)
-- Ensures exact GPS coordinates and snapshots are stored for every address and order.

-- 1. Ensure `addresses` has exact latitude and longitude
ALTER TABLE public.addresses
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Add delivery location snapshot columns to `orders`
-- Captures the exact delivery point at order placement time so future address edits don't corrupt historical orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS delivery_location_accuracy DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS delivery_address_text TEXT,
ADD COLUMN IF NOT EXISTS delivery_landmark TEXT;

-- 3. Indexes for spatial lookup, dispatch queries, and fleet metrics
CREATE INDEX IF NOT EXISTS idx_addresses_coords
ON public.addresses (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_orders_delivery_coords
ON public.orders (delivery_latitude, delivery_longitude);

-- 4. Verify RLS permissions on added columns
-- Supabase RLS is row-based (auth.uid() = user_id), so newly added columns on `addresses`
-- and `orders` automatically inherit the existing table policies.
