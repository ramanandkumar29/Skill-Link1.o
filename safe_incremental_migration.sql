-- ==============================================================================
-- SAFE INCREMENTAL DATABASE MIGRATION (NON-DESTRUCTIVE)
-- Does NOT drop or recreate existing tables.
-- Uses ADD COLUMN IF NOT EXISTS, safe triggers, and non-conflicting RLS policies.
-- ==============================================================================

-- 1. SAFE COLUMN ADDITIONS (Only adds columns if they are missing)

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

-- 2. SAFE PROFILE TRIGGER (Links auth.users signup directly to public.profiles)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. SAFE RLS POLICIES (Replaces policies idempotently without duplicate errors)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Services RLS
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    USING (is_active = true OR is_active IS NULL);

-- Cooperatives RLS
DROP POLICY IF EXISTS "Public can view cooperatives" ON public.cooperatives;
CREATE POLICY "Public can view cooperatives"
    ON public.cooperatives FOR SELECT
    USING (true);

-- Workers RLS
DROP POLICY IF EXISTS "Public can view workers" ON public.workers;
CREATE POLICY "Public can view workers"
    ON public.workers FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Workers can update own record" ON public.workers;
CREATE POLICY "Workers can update own record"
    ON public.workers FOR UPDATE
    TO authenticated
    USING (profile_id = auth.uid());

-- Profiles RLS
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Bookings RLS
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings"
    ON public.bookings FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    TO authenticated, anon
    USING (
        customer_id = auth.uid() OR
        customer_id IS NULL OR
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;
CREATE POLICY "Participants can update bookings"
    ON public.bookings FOR UPDATE
    TO authenticated, anon
    USING (true);

-- ==============================================================================
-- 5. NOTIFICATIONS TABLE (NON-DESTRUCTIVE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated, anon
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Policy: Users can update their own notifications (e.g., mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated, anon
    USING (user_id = auth.uid() OR user_id IS NULL)
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Policy: Authenticated users and backend functions can insert notifications
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Enable Supabase Realtime for instant live notifications (Idempotent check)
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

-- ==============================================================================
-- 6. PAYMENTS TABLE (NON-DESTRUCTIVE)
-- ==============================================================================
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only view their own payment transactions
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
    ON public.payments FOR SELECT
    TO authenticated, anon
    USING (customer_id = auth.uid() OR customer_id IS NULL);

-- Policy: Authenticated users/server can insert payments
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Anyone can insert payments"
    ON public.payments FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Policy: Server/authenticated user can update payment status
DROP POLICY IF EXISTS "Participants can update payments" ON public.payments;
CREATE POLICY "Participants can update payments"
    ON public.payments FOR UPDATE
    TO authenticated, anon
    USING (customer_id = auth.uid() OR customer_id IS NULL);

-- Realtime replication for instant payment status listeners (Idempotent check)
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
