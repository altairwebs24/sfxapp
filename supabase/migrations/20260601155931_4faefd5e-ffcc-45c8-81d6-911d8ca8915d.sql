
-- Restore EXECUTE on has_role — RLS policies invoke it as the authenticated role,
-- so revoking it broke every policy that calls public.has_role, which froze the app.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;

-- Replace the over-strict realtime.messages policy. The previous policy blocked
-- postgres_changes delivery for the notifications table. Allow authenticated
-- realtime usage; the underlying table RLS on public.notifications still
-- restricts which rows users actually receive.
DROP POLICY IF EXISTS "users subscribe to own notif topic" ON realtime.messages;
CREATE POLICY "authenticated realtime access" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
