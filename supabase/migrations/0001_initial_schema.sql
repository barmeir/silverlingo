-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
CREATE TYPE user_role AS ENUM ('elderly', 'teen');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- 2. Users Table (Extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC', -- IANA Timezone (e.g., 'America/New_York')
  age INTEGER CHECK (age > 0),
  country TEXT NOT NULL,
  streak_days INTEGER DEFAULT 0,        -- Gamification for Teen Learners
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Hobbies Table (Predefined list)
CREATE TABLE public.hobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Seed predefined hobbies
INSERT INTO public.hobbies (name, icon, category) VALUES
  ('Baking & Cooking', '🥐', 'Food'),
  ('Football / Soccer', '⚽', 'Sports'),
  ('World History', '🏛️', 'Culture'),
  ('Gardening', '🌻', 'Nature'),
  ('Classic Movies & Marvel', '🎬', 'Entertainment'),
  ('Music & Vinyl', '🎸', 'Arts'),
  ('Board Games & Chess', '♟️', 'Games'),
  ('Travel Stories', '✈️', 'Lifestyle');

-- 4. User_Hobbies Mapping Table
CREATE TABLE public.user_hobbies (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hobby_id UUID NOT NULL REFERENCES public.hobbies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hobby_id)
);

-- 5. Availability Table (Recurring 30-minute blocks stored in UTC)
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday (UTC)
  start_time TIME NOT NULL, -- Stored in UTC (e.g., '14:00:00')
  end_time TIME NOT NULL,   -- Stored in UTC (e.g., '14:30:00')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (host_id, day_of_week, start_time)
);

-- 6. Meetings Table (All timestamps in UTC)
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL, -- Stored in UTC
  scheduled_end TIMESTAMPTZ NOT NULL,   -- Stored in UTC (start + 30 mins)
  google_meet_link TEXT NOT NULL,
  ai_icebreaker TEXT NOT NULL,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_meeting_duration CHECK (scheduled_end > scheduled_start)
);

-- Indexes for fast timezone-aware lookups
CREATE INDEX idx_availability_host ON public.availability(host_id, day_of_week);
CREATE INDEX idx_meetings_participants ON public.meetings(host_id, learner_id, scheduled_start);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users are viewable by authenticated users" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Hobbies are viewable by everyone" ON public.hobbies
  FOR SELECT USING (true);

CREATE POLICY "User hobbies viewable by authenticated users" ON public.user_hobbies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Hosts manage own availability" ON public.availability
  FOR ALL TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Learners can view all availability" ON public.availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Participants can view their meetings" ON public.meetings
  FOR SELECT TO authenticated USING (auth.uid() = host_id OR auth.uid() = learner_id);
