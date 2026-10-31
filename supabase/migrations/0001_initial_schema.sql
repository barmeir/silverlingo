-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums (Idempotent: safe to run multiple times without "already exists" error)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('elderly', 'teen');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  age INTEGER CHECK (age > 0),
  country TEXT NOT NULL,
  city TEXT DEFAULT 'Tel Aviv',
  former_role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '/avatars/arthur.png',
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist even if table was created earlier
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Tel Aviv',
  ADD COLUMN IF NOT EXISTS former_role TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/avatars/arthur.png';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. Hobbies Table (Predefined list)
CREATE TABLE IF NOT EXISTS public.hobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Seed predefined hobbies (Idempotent via ON CONFLICT DO NOTHING)
INSERT INTO public.hobbies (name, icon, category) VALUES
  ('Baking & Cooking', '🥐', 'Food'),
  ('Football / Soccer', '⚽', 'Sports'),
  ('World History', '🏛️', 'Culture'),
  ('Gardening', '🌻', 'Nature'),
  ('Classic Movies & Marvel', '🎬', 'Entertainment'),
  ('Music & Vinyl', '🎸', 'Arts'),
  ('Board Games & Chess', '♟️', 'Games'),
  ('Travel Stories', '✈️', 'Lifestyle')
ON CONFLICT (name) DO NOTHING;

-- 4. User_Hobbies Mapping Table
CREATE TABLE IF NOT EXISTS public.user_hobbies (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hobby_id UUID NOT NULL REFERENCES public.hobbies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hobby_id)
);

-- 5. Availability Table (Recurring 30-minute blocks stored in UTC)
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (host_id, day_of_week, start_time)
);

-- 6. Meetings Table (All timestamps in UTC)
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  google_meet_link TEXT NOT NULL,
  ai_icebreaker TEXT NOT NULL,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_meeting_duration CHECK (scheduled_end > scheduled_start)
);

-- 7. Meeting Notifications Table (Stores SMS & Email sent to both accounts)
CREATE TABLE IF NOT EXISTS public.meeting_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  recipient_user_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  recipient_address TEXT NOT NULL,
  subject TEXT,
  message_body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_host ON public.availability(host_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_meetings_participants ON public.meetings(host_id, learner_id, scheduled_start);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notifications ENABLE ROW LEVEL SECURITY;

-- Policies (Idempotent: drop before create)
DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hobbies are viewable by everyone" ON public.hobbies;
CREATE POLICY "Hobbies are viewable by everyone" ON public.hobbies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public user_hobbies access" ON public.user_hobbies;
CREATE POLICY "Public user_hobbies access" ON public.user_hobbies
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public availability access" ON public.availability;
CREATE POLICY "Public availability access" ON public.availability
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public meetings access" ON public.meetings;
CREATE POLICY "Public meetings access" ON public.meetings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public meeting_notifications access" ON public.meeting_notifications;
CREATE POLICY "Public meeting_notifications access" ON public.meeting_notifications
  FOR ALL USING (true) WITH CHECK (true);
