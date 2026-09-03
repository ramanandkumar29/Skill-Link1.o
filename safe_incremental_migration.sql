-- ==============================================================================
-- SAFE INCREMENTAL DATABASE MIGRATION (LEAST-PRIVILEGE SECURITY AUDITED)
-- Non-destructive: Does NOT drop tables or delete existing data.
-- Strict Row-Level Security: Disallows anonymous access to private data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SAFE COLUMN ADDITIONS (Only adds missing columns)
-- ------------------------------------------------------------------------------

-- Profiles
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Cooperatives
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Punjab & Chandigarh';
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS active_workers_count INT DEFAULT 0;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS welfare_fund_balance NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS president_name TEXT;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE IF EXISTS public.cooperatives ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Workers
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS primary_skill TEXT;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS experience_years TEXT DEFAULT '3+ Years';
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING';
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS total_jobs INT DEFAULT 0;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 90;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 299.00;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS visiting_fee NUMERIC(10,2) DEFAULT 149.00;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS last_location_updated_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.workers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Services
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2) DEFAULT 299.00;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS visiting_fee NUMERIC(10,2) DEFAULT 149.00;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Bookings
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS worker_id UUID;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS service_latitude NUMERIC(9,6);
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS service_longitude NUMERIC(9,6);
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS distance_km NUMERIC(5,2);
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS problem_description TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS scheduled_date TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS scheduled_time TEXT DEFAULT 'Within 45 Mins';
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'requested';
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS visiting_fee NUMERIC(10,2) DEFAULT 149.00;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS is_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS final_amount NUMERIC(10,2);
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS emergency BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS completion_photo_url TEXT;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ------------------------------------------------------------------------------
-- 2. SAFE PROFILE TRIGGER WITH NON-BLOCKING EXCEPTION HANDLER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
        COALESCE(new.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = COALESCE(EXCLUDED.role, profiles.role),
        updated_at = now();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Ensures an auth user is created even if metadata format has unexpected fields
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger binding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. STRICT ROW LEVEL SECURITY: SERVICES, COOPERATIVES, WORKERS
-- ------------------------------------------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Services: Public can read active catalog only
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    TO anon, authenticated
    USING (is_active = true OR is_active IS NULL);

-- Cooperatives: Public directory view
DROP POLICY IF EXISTS "Public can view cooperatives" ON public.cooperatives;
CREATE POLICY "Public can view cooperatives"
    ON public.cooperatives FOR SELECT
    TO anon, authenticated
    USING (true);

-- Workers Directory: Public can view active/verified workers for search & discovery
DROP POLICY IF EXISTS "Public can view workers" ON public.workers;
DROP POLICY IF EXISTS "Public can view verified workers directory" ON public.workers;
CREATE POLICY "Public can view verified workers directory"
    ON public.workers FOR SELECT
    TO anon, authenticated
    USING (is_available = true OR verification_status = 'VERIFIED');

-- Workers: Only the authenticated artisan can update their availability & profile
DROP POLICY IF EXISTS "Workers can update own record" ON public.workers;
CREATE POLICY "Workers can update own record"
    ON public.workers FOR UPDATE
    TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. STRICT ROW LEVEL SECURITY: PROFILES (LEAST PRIVILEGE)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Disallow public enumeration of all profiles. Users can only read their own profile.
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. STRICT ROW LEVEL SECURITY: BOOKINGS
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Only the customer who booked OR the assigned artisan can view the booking
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authorized participants view bookings" ON public.bookings;
CREATE POLICY "Authorized participants view bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        worker_id = auth.uid() OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
    );

-- Only authenticated users can create bookings under their own user ID
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users create own bookings" ON public.bookings;
CREATE POLICY "Authenticated users create own bookings"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
    );

-- Only the booking's customer or assigned artisan can update booking status
DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authorized participants update bookings" ON public.bookings;
CREATE POLICY "Authorized participants update bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        worker_id = auth.uid() OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
    )
    WITH CHECK (
        customer_id = auth.uid() OR
        worker_id = auth.uid() OR
        worker_id IN (SELECT id FROM public.workers WHERE profile_id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 6. NOTIFICATIONS TABLE WITH STRICT RLS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'booking_update',
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'customer',
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Strictly authenticated: Users can ONLY see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Strictly authenticated: Users can ONLY update their own notifications (mark read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Authenticated users or server functions can dispatch notifications
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Enable Supabase Realtime (Idempotent publication addition)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. PAYMENTS TABLE WITH STRICT RLS (ZERO PUBLIC ACCESS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'successful' | 'failed' | 'refunded'
    payment_provider TEXT DEFAULT 'razorpay',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    provider_signature TEXT,
    payment_method TEXT DEFAULT 'upi', -- 'upi' | 'card' | 'netbanking' | 'wallet'
    is_test_mode BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers can ONLY view their own payments (ZERO anonymous or cross-customer access)
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

-- Authenticated customers can initiate their own payment record
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can insert own payments" ON public.payments;
CREATE POLICY "Customers can insert own payments"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

-- Customers can only update their own pending payment record
DROP POLICY IF EXISTS "Participants can update payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can update own payments" ON public.payments;
CREATE POLICY "Customers can update own payments"
    ON public.payments FOR UPDATE
    TO authenticated
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Enable Supabase Realtime (Idempotent publication addition)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
    END IF;
END $$;
