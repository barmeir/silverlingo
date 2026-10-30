-- Add email, phone, and profile fields to public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Tel Aviv',
  ADD COLUMN IF NOT EXISTS former_role TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/avatars/arthur.png';

-- Allow profiles created via phone/onboarding without auth.users FK to be stored in public.users
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Allow public/anon read & upsert on public.users, public.user_hobbies, public.meetings for seamless demo & production usage
DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public user_hobbies access" ON public.user_hobbies;
CREATE POLICY "Public user_hobbies access" ON public.user_hobbies
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public meetings access" ON public.meetings;
CREATE POLICY "Public meetings access" ON public.meetings
  FOR ALL USING (true) WITH CHECK (true);

-- Create meeting_notifications table to log SMS & Email sent to both accounts in a meeting
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

ALTER TABLE public.meeting_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public meeting_notifications access" ON public.meeting_notifications;
CREATE POLICY "Public meeting_notifications access" ON public.meeting_notifications
  FOR ALL USING (true) WITH CHECK (true);
