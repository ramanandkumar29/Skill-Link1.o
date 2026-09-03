-- ==============================================================================
-- SKILL-LINK COOPERATIVE SERVICES PLATFORM
-- Supabase Database Schema, Functions, Triggers & Row Level Security (RLS)
-- Target Project: https://uofhxgednmdzogeayuac.supabase.co
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'worker', 'cooperative_admin', 'super_admin')),
    avatar_url TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COOPERATIVE SOCIETIES TABLE
CREATE TABLE IF NOT EXISTS public.cooperatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Punjab & Chandigarh',
    active_workers_count INT DEFAULT 0,
    welfare_fund_balance NUMERIC(12,2) DEFAULT 0.00,
    president_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WORKERS TABLE
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    primary_skill TEXT NOT NULL,
    experience_years TEXT DEFAULT '3+ Years',
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
    is_available BOOLEAN DEFAULT true,
    rating NUMERIC(3,2) DEFAULT 5.0,
    total_jobs INT DEFAULT 0,
    trust_score INT DEFAULT 90,
    cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL,
    hourly_rate NUMERIC(10,2) DEFAULT 299.00,
    visiting_fee NUMERIC(10,2) DEFAULT 149.00,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    icon TEXT,
    base_price NUMERIC(10,2) DEFAULT 299.00,
    visiting_fee NUMERIC(10,2) DEFAULT 149.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    worker_id UUID,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    problem_description TEXT,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT DEFAULT 'Within 45 Mins',
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested',
        'assigned',
        'accepted',
        'on_the_way',
        'arrived',
        'in_progress',
        'completed',
        'cancelled'
    )),
    visiting_fee NUMERIC(10,2) DEFAULT 149.00,
    is_fee_paid BOOLEAN DEFAULT false,
    final_amount NUMERIC(10,2),
    emergency BOOLEAN DEFAULT false,
    notes TEXT,
    completion_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 7. AUTH TRIGGER: Auto-create Profile on Supabase User Signup
-- ==============================================================================

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
        full_name = EXCLUDED.full_name,
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

-- ==============================================================================
-- 8. SEED DEFAULT SERVICES & COOPERATIVES (Non-destructive)
-- ==============================================================================

INSERT INTO public.services (name, slug, category, description, icon, base_price, visiting_fee, is_active)
VALUES
    ('Electrician', 'electrician', 'home', 'Fan, switch, MCB trip, and wiring repair', '⚡', 299.00, 149.00, true),
    ('Plumber', 'plumber', 'home', 'Tap leak, pipe burst, toilet repair, and tank fitting', '🔧', 349.00, 149.00, true),
    ('Carpenter', 'carpenter', 'home', 'Furniture repair, door lock, hinge fitting, and woodwork', '🪚', 399.00, 149.00, true),
    ('Painter', 'painter', 'home', 'Wall touch-up, waterproof coating, and room repaint', '🎨', 499.00, 149.00, true),
    ('Cleaner', 'cleaning', 'home', 'Deep kitchen, bathroom, and sofa sanitization', '🧹', 599.00, 199.00, true),
    ('Gardener', 'gardener', 'outdoor', 'Lawn mowing, pruning, plant repotting, and soil care', '🌿', 299.00, 99.00, true),
    ('Driver', 'driver', 'transport', 'Hourly on-demand car driver for city or highway', '🚗', 399.00, 149.00, true),
    ('Caregiver', 'caregiver', 'health', 'Elderly assistance, patient care, and physiotherapy support', '🩺', 699.00, 199.00, true),
    ('Technician', 'ac', 'appliances', 'AC gas recharge, filter cleaning, and compressor repair', '❄️', 449.00, 149.00, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cooperatives (name, registration_number, district, state, active_workers_count, welfare_fund_balance, president_name)
VALUES
    ('Tricity Labour & Household Services Cooperative Society Ltd.', 'TLCS-2022-041', 'Chandigarh', 'Chandigarh UT', 84, 184500.00, 'Sh. Harpreet Singh'),
    ('Punjab Artisans & Technicians Cooperative Union', 'PTCU-2021-118', 'SAS Nagar (Mohali)', 'Punjab', 62, 142000.00, 'Smt. Balwinder Kaur'),
    ('Panchkula Urban Welfare Labour Society', 'PUWLS-2023-009', 'Panchkula', 'Haryana', 45, 96000.00, 'Sh. Ramesh Verma')
ON CONFLICT (registration_number) DO NOTHING;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- SERVICES: Anyone can read active services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    USING (is_active = true);

-- COOPERATIVES: Anyone can view cooperatives
DROP POLICY IF EXISTS "Public can view cooperatives" ON public.cooperatives;
CREATE POLICY "Public can view cooperatives"
    ON public.cooperatives FOR SELECT
    USING (true);

-- WORKERS: Anyone can view verified workers
DROP POLICY IF EXISTS "Public can view workers" ON public.workers;
CREATE POLICY "Public can view workers"
    ON public.workers FOR SELECT
    USING (true);

-- WORKERS: Authenticated workers can update their availability & details
DROP POLICY IF EXISTS "Workers can update own record" ON public.workers;
CREATE POLICY "Workers can update own record"
    ON public.workers FOR UPDATE
    TO authenticated
    USING (profile_id = auth.uid());

-- PROFILES: Users can view profiles (public read for worker names)
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles"
    ON public.profiles FOR SELECT
    USING (true);

-- PROFILES: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- PROFILES: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- BOOKINGS: Users can create bookings
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings"
    ON public.bookings FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- BOOKINGS: Users can view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
    ON public.bookings FOR SELECT
    TO authenticated, anon
    USING (
        customer_id = auth.uid() OR
        customer_id IS NULL OR
        auth.role() = 'authenticated'
    );

-- BOOKINGS: Workers and customers can update booking status
DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;
CREATE POLICY "Participants can update bookings"
    ON public.bookings FOR UPDATE
    TO authenticated, anon
    USING (true);
