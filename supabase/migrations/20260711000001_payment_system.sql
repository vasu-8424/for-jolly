-- =========================================================
-- PAYMENT SYSTEM SCHEMA
-- =========================================================

-- 1. PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    payment_provider TEXT DEFAULT 'Cashfree',
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    gateway_order_id TEXT UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Paid', 'Failed', 'Cancelled', 'Refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAYMENT TRANSACTIONS (Optional but requested for detailed tracking)
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway_transaction_id TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL,
    payment_method_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAYMENT LOGS
CREATE TABLE public.payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REFUNDS
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    refund_amount DECIMAL(12, 2) NOT NULL,
    refund_status TEXT DEFAULT 'Pending' CHECK (refund_status IN ('Pending', 'Processed', 'Failed')),
    refund_id TEXT UNIQUE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER STATUS HISTORY
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and Realtime (assuming realtime was not fully enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Triggers for updated_at
CREATE TRIGGER update_payments_modtime
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_refunds_modtime
BEFORE UPDATE ON public.refunds
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
