-- Migration to support Firebase Auth UIDs while keeping the UUID primary key

-- 1. Drop the foreign key constraint that requires users to exist in Supabase auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Add a new column to store the Firebase UID
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- 3. Temporarily allow anonymous users to insert and select data since they authenticate via Firebase
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on addresses" ON public.addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on addresses" ON public.addresses FOR SELECT USING (true);
CREATE POLICY "Allow public update on addresses" ON public.addresses FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on order_items" ON public.order_items FOR SELECT USING (true);
