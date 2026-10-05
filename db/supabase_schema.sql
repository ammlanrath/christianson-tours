-- Christianson Tours Complete PostgreSQL Schema for Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Supabase Auth Link)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEMO CONFIG & EXPIRATION TABLE (7-Day Demo Gate)
CREATE TABLE IF NOT EXISTS public.demo_config (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'default',
  client_name VARCHAR(255) DEFAULT 'Christianson Tours',
  developer_name VARCHAR(255) DEFAULT 'Ammlan Rath',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default demo config if missing
INSERT INTO public.demo_config (id, client_name, developer_name, started_at, expires_at, status)
VALUES ('default', 'Christianson Tours', 'Ammlan Rath', NOW(), NOW() + INTERVAL '7 days', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. TOURS TABLE
CREATE TABLE IF NOT EXISTS public.tours (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  badge VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 4.90,
  review_count INTEGER DEFAULT 0,
  duration VARCHAR(100) NOT NULL,
  duration_type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  hero_image TEXT,
  summary TEXT,
  highlights JSONB
);

-- 4. PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.packages (
  id VARCHAR(100) PRIMARY KEY,
  tour_id VARCHAR(100) REFERENCES public.tours(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  badge VARCHAR(100),
  pickup INTEGER DEFAULT 1,
  admission INTEGER DEFAULT 1,
  breakfast INTEGER DEFAULT 1,
  lunch INTEGER DEFAULT 0,
  skywalk INTEGER DEFAULT 0,
  features JSONB
);

-- 5. ITINERARIES TABLE
CREATE TABLE IF NOT EXISTS public.itineraries (
  id SERIAL PRIMARY KEY,
  tour_id VARCHAR(100) REFERENCES public.tours(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  time VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  icon VARCHAR(50)
);

-- 6. ADDONS TABLE
CREATE TABLE IF NOT EXISTS public.addons (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  tours JSONB
);

-- 7. HOTELS TABLE
CREATE TABLE IF NOT EXISTS public.hotels (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(100) NOT NULL,
  pickup_time VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255) NOT NULL,
  rating INTEGER DEFAULT 5,
  date VARCHAR(50) NOT NULL,
  tour_name VARCHAR(255) NOT NULL,
  tags JSONB,
  comment TEXT NOT NULL,
  owner_response TEXT,
  status VARCHAR(50) DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED'))
);

-- 9. FAQS TABLE
CREATE TABLE IF NOT EXISTS public.faqs (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- 10. AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS public.availability (
  id SERIAL PRIMARY KEY,
  tour_id VARCHAR(100) REFERENCES public.tours(id) ON DELETE CASCADE,
  date VARCHAR(50) NOT NULL,
  max_capacity INTEGER DEFAULT 30,
  booked_seats INTEGER DEFAULT 0,
  CONSTRAINT unique_tour_date UNIQUE(tour_id, date)
);

-- 11. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id VARCHAR(100) PRIMARY KEY,
  tour_id VARCHAR(100) REFERENCES public.tours(id),
  package_id VARCHAR(100) NOT NULL,
  date VARCHAR(50) NOT NULL,
  adults INTEGER DEFAULT 1,
  kids INTEGER DEFAULT 0,
  hotel_id VARCHAR(100) NOT NULL,
  hotel_name VARCHAR(255) NOT NULL,
  pickup_time VARCHAR(50) NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),
  addons JSONB,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  payment_status VARCHAR(50) DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own profile; Admins can read all profiles
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Demo Config: Public read access
CREATE POLICY "Public read demo_config" ON public.demo_config FOR SELECT USING (true);

-- Catalog Tables: Public Read Access
CREATE POLICY "Public read tours" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Public read packages" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Public read itineraries" ON public.itineraries FOR SELECT USING (true);
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Public read hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Public read availability" ON public.availability FOR SELECT USING (true);

-- Public Submissions: Create Bookings & Reviews
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Admin Full Management Access Policies
CREATE POLICY "Admin manage tours" ON public.tours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage packages" ON public.packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage availability" ON public.availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage bookings" ON public.bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for auto-creating Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'customer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
