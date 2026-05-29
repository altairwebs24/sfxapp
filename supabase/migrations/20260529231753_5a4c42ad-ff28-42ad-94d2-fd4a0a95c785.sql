
-- Enable realtime for signals & notifications
ALTER TABLE public.signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Admin can write signals (server fn already uses service role but keep policy for safety)
CREATE POLICY "admins manage signals" ON public.signals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Payment requests (WhatsApp manual flow)
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL,
  amount_zar NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own payment" ON public.payment_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users read own payment" ON public.payment_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage payments" ON public.payment_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
