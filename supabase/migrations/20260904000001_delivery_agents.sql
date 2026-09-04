-- ==============================================================================
-- AERVO APP / KAKINADA FRESH: DELIVERY AGENTS ROSTER & ACTIVE ORDER CONSTRAINT
-- ==============================================================================

-- 1. Create delivery_agents table
CREATE TABLE IF NOT EXISTS public.delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_number TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'bike', -- 'bike', 'scooter', 'cycle', 'other'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'inactive'
  user_id TEXT REFERENCES public.users(firebase_uid) ON DELETE SET NULL, -- nullable, for future driver account linking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Unique index on phone number for delivery agents
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_agents_phone ON public.delivery_agents(phone);

-- 3. Add agent_id column to orders table if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN agent_id UUID REFERENCES public.delivery_agents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. CRITICAL CONSTRAINT: Enforce "one active order per agent" at the database level
-- Any second attempt to assign an agent while their current order is still active
-- will throw a unique constraint violation (PostgreSQL error code 23505).
-- Note: Uses direct ENUM values without locale-dependent functions so it is strictly IMMUTABLE.
DROP INDEX IF EXISTS public.one_active_order_per_agent;

CREATE UNIQUE INDEX one_active_order_per_agent 
ON public.orders (agent_id) 
WHERE status NOT IN ('Delivered', 'Cancelled', 'Returned', 'Refunded') AND agent_id IS NOT NULL;

-- 5. Enable Row Level Security (RLS) on delivery_agents
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies on delivery_agents
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'delivery_agents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.delivery_agents', pol.policyname);
    END LOOP;
END $$;

-- TEMPORARY: relies on app-level admin checks only. Requires Firebase JWT bridging before production launch. See Admin Panel Technical Audit (Section 3: Role & Access Control).
CREATE POLICY "Allow select on delivery_agents" ON public.delivery_agents FOR SELECT USING (true);
CREATE POLICY "Allow insert on delivery_agents" ON public.delivery_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on delivery_agents" ON public.delivery_agents FOR UPDATE USING (true);
CREATE POLICY "Allow delete on delivery_agents" ON public.delivery_agents FOR DELETE USING (true);
