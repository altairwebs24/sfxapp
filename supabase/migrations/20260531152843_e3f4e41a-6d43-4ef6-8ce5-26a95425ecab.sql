
-- Extend account_status enum
ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'declined';

-- profiles: education flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS education_enrolled boolean NOT NULL DEFAULT false;

-- app_settings: feature icons jsonb
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS feature_icons jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Update signup handler to also drop a welcome notification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, surname, username, phone, country_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'surname',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+27')
  );
  IF LOWER(NEW.email) = 'simphiwenkhosingphepsilemabuza@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.profiles SET status = 'approved', plan = 'premium' WHERE id = NEW.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.notifications (user_id, title, body)
  VALUES (
    NEW.id,
    'Welcome to SIMPHIWEFXACADEMY 🎉',
    'Your account has been created. An admin will review and approve shortly.'
  );
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Education lessons
CREATE TABLE IF NOT EXISTS public.education_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body_md text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_lessons TO authenticated;
GRANT ALL ON public.education_lessons TO service_role;
ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrolled or premium read lessons"
  ON public.education_lessons FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND (p.education_enrolled = true OR p.plan = 'premium' OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "admins manage lessons"
  ON public.education_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Education quizzes
CREATE TABLE IF NOT EXISTS public.education_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.education_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  order_index int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.education_quizzes TO authenticated;
GRANT ALL ON public.education_quizzes TO service_role;
ALTER TABLE public.education_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrolled or premium read quizzes"
  ON public.education_quizzes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND (p.education_enrolled = true OR p.plan = 'premium' OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "admins manage quizzes"
  ON public.education_quizzes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Education progress
CREATE TABLE IF NOT EXISTS public.education_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.education_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz,
  quiz_score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE ON public.education_progress TO authenticated;
GRANT ALL ON public.education_progress TO service_role;
ALTER TABLE public.education_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own progress"
  ON public.education_progress FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Seed 10 lessons (idempotent)
INSERT INTO public.education_lessons (slug, title, order_index, body_md) VALUES
('what-is-forex', 'What is Forex?', 1, '# What is Forex?

The foreign exchange market (forex) is the global marketplace for trading national currencies. It is the largest, most liquid market in the world with daily volume exceeding $7 trillion.

**Key ideas**
- Currencies trade in pairs (EUR/USD, GBP/JPY).
- The first currency is the *base*, the second is the *quote*.
- Price tells you how much of the quote currency 1 unit of the base costs.

You profit by buying a pair you expect to rise, or selling one you expect to fall.'),
('pips-and-points', 'Pips & Points', 2, '# Pips & Points

A **pip** is the smallest standard price move in most pairs — the 4th decimal place (0.0001). For JPY pairs it is the 2nd decimal (0.01).

A **point** (sometimes called a pipette) is 1/10 of a pip.

Gold (XAUUSD) and indices use whole-number points instead of pips.'),
('lot-size', 'Lot Size & Position Sizing', 3, '# Lot Size

- Standard lot = 100,000 units
- Mini lot = 10,000 units
- Micro lot = 1,000 units

**Position sizing rule**: never risk more than 1–2% of your account on a single trade. Lot size should be derived from your stop-loss distance and risk amount, not the other way around.'),
('leverage', 'Leverage & Margin', 4, '# Leverage

Leverage lets you control a large position with a small deposit. 1:100 leverage means $1 controls $100.

**Warning**: leverage amplifies both wins and losses. It is the #1 reason beginner accounts blow up. Use modest leverage until you are consistently profitable.'),
('order-types', 'Order Types', 5, '# Order Types

- **Market order** — execute now at current price.
- **Limit order** — execute only at price X or better.
- **Stop order** — execute when price crosses X (breakout entries).
- **Stop-loss** — protective exit.
- **Take-profit** — target exit.

Always set a stop-loss before entering. No exceptions.'),
('support-resistance', 'Support & Resistance', 6, '# Support & Resistance

**Support** = price floor where buyers consistently step in.
**Resistance** = price ceiling where sellers consistently step in.

When broken, support often becomes resistance and vice versa. Mark major S/R zones on higher timeframes (H4, D1) and trade reactions on lower ones.'),
('trend', 'Trend Identification', 7, '# Trend Identification

- **Uptrend** = higher highs + higher lows.
- **Downtrend** = lower highs + lower lows.
- **Range** = horizontal highs/lows.

Trade with the trend on the higher timeframe. Use EMAs (9/21/50) as dynamic trend filters.'),
('risk-management', 'Risk Management', 8, '# Risk Management

The single most important skill. Rules:
1. Risk fixed % per trade (1–2%).
2. Minimum 1:2 risk:reward.
3. No revenge trading after a loss.
4. Daily loss cap — walk away when hit.
5. Journal every trade.'),
('trading-plan', 'Building a Trading Plan', 9, '# Trading Plan

A written plan covers:
- Markets and sessions you trade.
- Strategy + exact entry/exit rules.
- Risk per trade and daily drawdown limit.
- Routine (pre-market, post-market journaling).

A plan you do not follow is worse than no plan.'),
('psychology', 'Trading Psychology', 10, '# Trading Psychology

Your worst enemy is yourself. The four killers:
- **Fear** — exiting winners too early.
- **Greed** — oversizing and ignoring rules.
- **Hope** — moving stops on losers.
- **Revenge** — chasing after losses.

Discipline beats prediction. Process over outcome.')
ON CONFLICT (slug) DO NOTHING;

-- Seed quizzes (2 per lesson for brevity, all linked by slug lookup)
INSERT INTO public.education_quizzes (lesson_id, question, options, correct_index, order_index)
SELECT l.id, q.question, q.options::jsonb, q.correct_index, q.order_index
FROM public.education_lessons l
JOIN (VALUES
  ('what-is-forex', 'What does the base currency in EUR/USD refer to?', '["USD","EUR","Gold","Neither"]', 1, 1),
  ('what-is-forex', 'Approximate daily forex volume is:', '["$70 billion","$700 billion","$7 trillion","$70 trillion"]', 2, 2),
  ('pips-and-points', 'A pip on EURUSD is which decimal?', '["1st","2nd","3rd","4th"]', 3, 1),
  ('pips-and-points', 'A point is:', '["10 pips","1/10 of a pip","Same as a pip","Only used in stocks"]', 1, 2),
  ('lot-size', 'A standard lot is how many units?', '["1,000","10,000","100,000","1,000,000"]', 2, 1),
  ('lot-size', 'Max recommended risk per trade is:', '["1–2%","5%","10%","25%"]', 0, 2),
  ('leverage', '1:100 leverage means $1 controls:', '["$10","$100","$1,000","$10,000"]', 1, 1),
  ('leverage', 'Leverage primarily amplifies:', '["Only profits","Only losses","Both","Neither"]', 2, 2),
  ('order-types', 'A stop-loss is:', '["A profit target","A protective exit","A market order","A leverage setting"]', 1, 1),
  ('order-types', 'A limit order executes:', '["Immediately","At price X or better","Never","Only at close"]', 1, 2),
  ('support-resistance', 'Broken support often becomes:', '["Stronger support","Resistance","Irrelevant","A pip"]', 1, 1),
  ('support-resistance', 'S/R is most reliable on:', '["1m","5m","H4/D1","Tick chart"]', 2, 2),
  ('trend', 'An uptrend shows:', '["Lower highs","Higher highs + higher lows","Equal highs","Random"]', 1, 1),
  ('trend', 'EMAs are used as:', '["Random lines","Trend filters","News feeds","Lot sizers"]', 1, 2),
  ('risk-management', 'Minimum recommended R:R is:', '["1:0.5","1:1","1:2","1:0.1"]', 2, 1),
  ('risk-management', 'After a big loss you should:', '["Revenge trade","Double size","Walk away / hit daily cap","Remove stop-loss"]', 2, 2),
  ('trading-plan', 'A trading plan must include:', '["Only entries","Only exits","Entry, exit, risk, routine","Just gut feel"]', 2, 1),
  ('trading-plan', 'A plan you do not follow is:', '["Better than none","Worse than none","Same as none","Profitable"]', 1, 2),
  ('psychology', 'Moving stops on losers is driven by:', '["Discipline","Hope","Skill","Logic"]', 1, 1),
  ('psychology', 'Long-term winners focus on:', '["Outcome","Process","Luck","Tips"]', 1, 2)
) AS q(slug, question, options, correct_index, order_index)
ON l.slug = q.slug
ON CONFLICT DO NOTHING;
