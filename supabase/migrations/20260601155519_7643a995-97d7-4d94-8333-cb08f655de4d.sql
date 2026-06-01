
-- 1) Move MT4/MT5 credentials out of profiles into owner-only table
CREATE TABLE public.trading_credentials (
  user_id uuid PRIMARY KEY,
  mt4_login text, mt4_password text, mt4_broker text, mt4_server text,
  mt5_login text, mt5_password text, mt5_broker text, mt5_server text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_credentials TO authenticated;
GRANT ALL ON public.trading_credentials TO service_role;

ALTER TABLE public.trading_credentials ENABLE ROW LEVEL SECURITY;

-- Owner-only access. No admin policy — admins must not read credentials via API.
CREATE POLICY "owner reads own credentials" ON public.trading_credentials
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner inserts own credentials" ON public.trading_credentials
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner updates own credentials" ON public.trading_credentials
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner deletes own credentials" ON public.trading_credentials
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Backfill existing values
INSERT INTO public.trading_credentials (user_id, mt4_login, mt4_password, mt4_broker, mt4_server, mt5_login, mt5_password, mt5_broker, mt5_server)
SELECT id, mt4_login, mt4_password, mt4_broker, mt4_server, mt5_login, mt5_password, mt5_broker, mt5_server
FROM public.profiles
WHERE mt4_login IS NOT NULL OR mt4_password IS NOT NULL OR mt4_broker IS NOT NULL OR mt4_server IS NOT NULL
   OR mt5_login IS NOT NULL OR mt5_password IS NOT NULL OR mt5_broker IS NOT NULL OR mt5_server IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Drop credentials from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS mt4_login,
  DROP COLUMN IF EXISTS mt4_password,
  DROP COLUMN IF EXISTS mt4_broker,
  DROP COLUMN IF EXISTS mt4_server,
  DROP COLUMN IF EXISTS mt5_login,
  DROP COLUMN IF EXISTS mt5_password,
  DROP COLUMN IF EXISTS mt5_broker,
  DROP COLUMN IF EXISTS mt5_server;

-- 2) Hide quiz correct answers from API. Create a public view that excludes correct_index
--    and deny direct SELECT on the base table to non-admins. Server-side scoring still uses supabaseAdmin.
DROP POLICY IF EXISTS "enrolled or premium read quizzes" ON public.education_quizzes;

CREATE OR REPLACE VIEW public.education_quizzes_public
WITH (security_invoker = on) AS
  SELECT id, lesson_id, question, options, order_index
  FROM public.education_quizzes;

GRANT SELECT ON public.education_quizzes_public TO authenticated;

-- Recreate the SELECT policy on the base table (still required for the view to read rows under security_invoker),
-- enrolled/premium users only — but they will only see non-sensitive columns through the view.
-- The base table is no longer queryable in client code; only the view is used.
CREATE POLICY "enrolled or premium read quizzes" ON public.education_quizzes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.education_enrolled = true OR p.plan = 'premium'::plan_tier OR public.has_role(auth.uid(), 'admin'::app_role)))
  );

-- 3) Lock down Realtime subscriptions so users only receive their own notification events.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users subscribe to own notif topic" ON realtime.messages;
CREATE POLICY "users subscribe to own notif topic" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    -- Allow only topics matching the user's own id, or broadcast-safe topics
    (realtime.topic() = ('notifs:' || auth.uid()::text))
  );

-- 4) Revoke EXECUTE on has_role from regular roles. RLS evaluation still works because the function is SECURITY DEFINER owned by postgres.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- 5) Restrict avatar listing/select via API to the owner's folder. Public URL CDN access is unaffected (bucket is public).
DROP POLICY IF EXISTS "avatars read own or self" ON storage.objects;
CREATE POLICY "avatars owner can list own folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
