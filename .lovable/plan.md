# SFX App — Major Update Plan

This is a large multi-area change. I'll ship it in one pass but in clearly-scoped sections so it's easy to review.

## 1. Theme — strip neon, go black & white
- Update `src/styles.css`: background pure black, foreground pure white, primary = white, remove all blue glows. Replace `text-glow`, `glow`, `glow-soft`, `glow-red` with subtle white shadows / white outlines only. Keep glass cards but with white/10 borders.
- Audit components that hard-code blue (`text-primary` stays — primary becomes white).

## 2. Bottom navigation — feature bar
- Replace the 2-icon nav with a solid-black floating pill containing: **Signals · EA · Scanner · Education · Account** (icons + labels). 
- Bar is **only hidden on Home** (per spec: "the bar should move away only on the home screen"). Wait — re-read: "when navigating to the home screen display everything in the app and the bar should move away only on the home screen". I'll hide the bar on Home and show it on every other route.
- Home screen will surface all features as cards (already does) plus live signals feed.

## 3. Feature locking by plan
- Lite (R250): Signals only.
- Pro (R350): Signals + AI Scanner.
- Premium (R1300, **locked / Coming Soon**): + Education + EA.
- EA route: always shows a lock + "Coming Soon" — no one gets access yet.
- Education: locked unless premium (but premium itself is locked → effectively locked for all until you flip it on; admin can still grant).
- Any feature tap when locked → opens a Plans modal (the existing `/plans` page styled as a sheet).

## 4. Plans page updates
- Update `src/lib/whatsapp.ts` PLANS:
  - lite R250 — "Live signals"
  - pro R350 — "Live signals + AI chart scanner"
  - premium R1300 — "Everything + Education + EA — Coming Soon" (button disabled)

## 5. Admin panel (only `simphiwenkhosingphepsilemabuza@gmail.com`)
- Already exists at `/_app/admin`. Extend it with:
  - **Approve / Decline / Revoke / Block** actions (status: approved, pending, blocked + new "declined").
  - **Upgrade plan** dropdown (none / lite / pro / premium).
  - **Feature icons**: upload custom icon per feature key (signals, ea, scanner, education) → stored in `app_settings` JSONB column `feature_icons`. Uses existing `avatars` bucket.
- Add admin link button in Home header (visible only when `has_role(admin)`).

## 6. Welcome notification on signup
- Extend `handle_new_user()` trigger to also insert a row in `public.notifications` with title "Welcome to SIMPHIWEFXACADEMY 🎉" body "Your account is pending approval. We'll notify you once you're in.".
- Make Inbox icon on Home show a red dot when there are unread notifications (realtime subscribed already exists; just add a count badge).

## 7. Economic calendar — accurate dates
- The AI free-form fetch is unreliable. Replace `getEconomicEvents` with a **hardcoded curated list** of major recurring events for the next 60 days computed deterministically:
  - **NFP**: first Friday of each month, 13:30 UTC (15:30 SAST).
  - **FOMC / Fed Rate Decision**: fixed published dates for 2026 (Jan 28, Mar 18, Apr 29, Jun 17, Jul 29, Sep 16, Nov 4, Dec 16) at 19:00 UTC.
  - **ECB**: scheduled dates 2026 (Jan 22, Mar 12, Apr 16, Jun 4, Jul 23, Sep 10, Oct 29, Dec 17) at 13:15 UTC.
  - **US CPI**: ~mid-month (computed: second Wednesday) at 13:30 UTC.
  - **BoE**: known 2026 MPC dates at 12:00 UTC.
- Drop Gemini call entirely → no more wrong dates. SAST = UTC+2.

## 8. Live signals on Home + TP/SL tracker
- Home shows latest 3 active signals as cards with:
  - Pair, side, entry, TP, SL.
  - Live current price (TwelveData polled every 30s).
  - Progress bar: `(current - entry) / (TP - entry)` for buys (inverse for sells).
  - "X pts to TP · Y pts to SL".
- Realtime subscription via existing channel.

## 9. Past signals view
- Inside `/signals`, add tabs **Active · History**.
- History queries closed signals (`status != 'active'`) with WIN/LOSS badge, % move.

## 10. Education platform
- New route `/_app/education` — gated to `premium` plan (locked card otherwise).
- Content: 10 lesson modules covering forex basics (What is forex, Pips, Lot size, Leverage, Order types, Support/Resistance, Trend, Risk management, Trading plan, Psychology). Authored fresh in our voice — no source attribution.
- Each lesson has a 5-question multiple-choice quiz.
- New tables:
  - `education_lessons` (id, slug, title, body_md, order_index) — seeded.
  - `education_quizzes` (id, lesson_id, question, options jsonb, correct_index).
  - `education_progress` (id, user_id, lesson_id, completed_at, quiz_score).
- Registration fee: separate payment_request `plan='education'` R200, admin approves and flips a `education_enrolled` flag on the profile. (Premium subscribers auto-enrolled.)

## 11. Account / session memory
Already implemented in `_app.tsx`. Keep, but update Home button rule so it returns to last non-home route.

## Technical notes
- **DB migration** (one SQL): add `app_settings.feature_icons jsonb`, add `profiles.education_enrolled bool default false`, extend `account_status` enum with `declined`, update `handle_new_user()` to also insert welcome notification, create the 3 education tables with RLS + GRANTs, add `payment_requests.plan` accept value `'education'`.
- **Styling**: rewrite `src/styles.css` tokens; keep utility class names so component code keeps working.
- **TwelveData**: reuse existing API key secret.
- **No new external API keys** required.

## Out of scope (will mention in reply)
- Custom test allocation per registered education user (each user automatically gets all lessons/quizzes — that's the tracking).
- Email notification for welcome (in-app only).

Estimated files touched: ~15 edits + 2 new routes + 1 migration.
