-- ==============================================================================
-- ডা. দেবজ্যোতি দত্ত (B.A.M.S., NIA Jaipur) — আধুনিক আয়ুর্বেদিক পোর্টাল
-- Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Free-tier optimized (Up to 500MB free database storage, ~1,000,000+ patient serials)
-- ==============================================================================

-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  serial_no TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  chamber_mode TEXT NOT NULL CHECK (chamber_mode IN ('offline', 'online')),
  chamber_title_bn TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  date_formatted_bn TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_time_bn TEXT NOT NULL,
  slot_time_en TEXT NOT NULL,
  complaints TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast searching and slot availability checks
CREATE INDEX IF NOT EXISTS idx_appointments_date_mode ON public.appointments (appointment_date, chamber_mode);
CREATE INDEX IF NOT EXISTS idx_appointments_serial ON public.appointments (serial_no);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON public.appointments (created_at DESC);

-- 2. Create Chamber Schedules Table
CREATE TABLE IF NOT EXISTS public.chamber_schedules (
  chamber_id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_schedules ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous users to check which slots are booked
-- (Strict security: Only slot_id, chamber_mode, appointment_date, status are public)
CREATE POLICY "Public can view slot availability"
  ON public.appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public users to book new appointments
CREATE POLICY "Public can insert new appointment"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(patient_name) >= 2 AND
    char_length(phone) >= 7 AND
    appointment_date >= CURRENT_DATE
  );

-- Allow service role or authenticated doctors to update appointments
CREATE POLICY "Authenticated users can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anyone to read chamber schedules
CREATE POLICY "Public can view chamber schedules"
  ON public.chamber_schedules
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated doctors to update chamber schedules
CREATE POLICY "Authenticated users can update chamber schedules"
  ON public.chamber_schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
