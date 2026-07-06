-- =========================================================
-- FUNCTIONS
-- =========================================================

-- 1. Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Handle New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, profile_image)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 3. Stock Reduction on Order Packed
CREATE OR REPLACE FUNCTION reduce_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Only reduce stock if status transitions to 'Packed' from something else
    IF NEW.status = 'Packed' AND OLD.status != 'Packed' THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            IF item.variant_id IS NOT NULL THEN
                UPDATE public.product_variants SET stock = stock - item.quantity WHERE id = item.variant_id;
            ELSE
                UPDATE public.products SET stock = stock - item.quantity WHERE id = item.product_id;
            END IF;
            
            -- Optional: Log in inventory history
            INSERT INTO public.inventory_history (product_id, variant_id, change_type, quantity_changed, previous_stock, new_stock, reference_id)
            VALUES (
                item.product_id, 
                item.variant_id, 
                'Order', 
                -item.quantity, 
                0, -- simplified for this trigger
                0, 
                NEW.order_number
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Coupon Usage Counter Increment
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.coupons 
    SET used_count = used_count + 1 
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Wallet Balance Updater
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'Credit' THEN
        UPDATE public.users SET wallet_balance = wallet_balance + NEW.amount WHERE id = NEW.user_id;
    ELSIF NEW.transaction_type = 'Debit' THEN
        UPDATE public.users SET wallet_balance = wallet_balance - NEW.amount WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Attach updated_at trigger to all relevant tables
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.homepage_banners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.tax_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.support_messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auth Trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Order Status Stock Trigger
CREATE TRIGGER on_order_packed AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE PROCEDURE reduce_stock_on_order();

-- Coupon Usage Trigger
CREATE TRIGGER on_coupon_used AFTER INSERT ON public.coupon_usage FOR EACH ROW EXECUTE PROCEDURE increment_coupon_usage();

-- Wallet Transaction Trigger
CREATE TRIGGER on_wallet_transaction AFTER INSERT ON public.wallet_transactions FOR EACH ROW EXECUTE PROCEDURE update_wallet_balance();
