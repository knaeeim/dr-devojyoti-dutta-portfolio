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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled')),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  rescheduled_reason TEXT,
  rescheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- If the table already existed with older constraint, upgrade columns & constraints
DO $$
BEGIN
  -- Alter status check constraint if exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check') THEN
    ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
  END IF;
  ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'));

  -- Add extra tracking columns if they were not created
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE public.appointments ADD COLUMN cancellation_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'cancelled_at') THEN
    ALTER TABLE public.appointments ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'rescheduled_reason') THEN
    ALTER TABLE public.appointments ADD COLUMN rescheduled_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'rescheduled_at') THEN
    ALTER TABLE public.appointments ADD COLUMN rescheduled_at TIMESTAMPTZ;
  END IF;
END $$;

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

-- Drop old policies to avoid duplicate name errors
DROP POLICY IF EXISTS "Public can view slot availability" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert new appointment" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow server to update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow server to delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can view chamber schedules" ON public.chamber_schedules;
DROP POLICY IF EXISTS "Authenticated users can update chamber schedules" ON public.chamber_schedules;
DROP POLICY IF EXISTS "Allow server to insert or update schedules" ON public.chamber_schedules;

-- Read appointments (for receptionist, admin, and patient checking slots)
CREATE POLICY "Public can view slot availability"
  ON public.appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert new appointment
CREATE POLICY "Public can insert new appointment"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(patient_name) >= 2 AND
    char_length(phone) >= 7
  );

-- Update appointment status (confirm, reschedule, cancel)
CREATE POLICY "Allow server to update appointments"
  ON public.appointments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Delete appointment (permanent deletion by admin)
CREATE POLICY "Allow server to delete appointments"
  ON public.appointments
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Chamber Schedules policies
CREATE POLICY "Public can view chamber schedules"
  ON public.chamber_schedules
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow server to insert or update schedules"
  ON public.chamber_schedules
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
