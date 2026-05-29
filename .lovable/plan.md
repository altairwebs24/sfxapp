
# SIMPHIWEFXACADEMY (SFX) — Build Plan

This is a very large app. I cannot literally clone the other Lovable project (its source isn't accessible), but I'll rebuild the same surface area with your branding, logo, copy and the futuristic black + light-blue glass design you described. I'll ship it in phases so you see progress fast and can steer.

## Phase 1 — Foundation (this turn)
- Enable Lovable Cloud (auth + database + storage).
- Design system: black background, light-blue/white glow tokens, glass morphism utilities, rounded corners, bounce animations, hide scrollbars. All tokens in `src/styles.css`.
- Add your wolf logo as the app logo + PWA icon + splash.
- PWA manifest (installable, standalone, custom icon). No service worker (per Lovable PWA guidance — installable manifest only).
- Router shell, root layout, navigation with blurred tab bar.

## Phase 2 — Auth & Profiles
- Supabase email/password auth, session persistence, "remember me".
- Tables: `profiles` (name, surname, username unique, phone, country, plan, status pending/approved/blocked, mt4/mt5 details, avatar), `user_roles` (admin/user with `has_role` SDF), `notifications`, `subscriptions`, `signals`, `app_settings` (admin-controlled theme/logo/name/wallpaper).
- Sign in + Register pages with iOS-style transitions, password eye, country code selector (default +27 South Africa).
- Seed admin: `Simphiwenkhosingphepsilemabuza@gmail.com` / `Simphiwe@2007` with admin role.
- Pending-approval gate: non-approved users see "awaiting admin approval" screen.

## Phase 3 — Dashboard, Signals, Scanner, EA
- Home: dynamic greeting (morning/afternoon/night), live date, 3 glass cards (Signals / AI Scanner / EA), TP/SL tracker card with red glow.
- Signals page: TwelveData live prices for USDJPY, EURUSD, GBPUSD, XAUUSD, BTCUSD, NZDUSD, DJI. EMA-based signal generation in a server function. One active signal per pair, persisted until TP/SL hit. Day/swing only.
- AI Scanner: chart image upload → server function calls Lovable AI Gateway (Gemini vision) with EMA-strategy prompt → returns Entry/TP/SL/reasons. Inline result panel with view/hide toggle.
- EA Dashboard: Start/Stop/Quotes/Theme buttons, quotes modal (pair, lot size, # trades, buy/sell/both), "AUTOMATED TRADING" card, admin-controlled EA logo/name.

## Phase 4 — Plans, Payments, Account, Notifications, Calendar, Admin
- Plans (Lite R300 / Pro R600 / Premium R1500) with lock icons + upgrade prompts.
- Yoco payment integration (requires you to add `YOCO_SECRET_KEY` secret).
- Account page: username, avatar upload, MT4 + MT5 broker details (full broker list).
- Inbox + iOS-style slide-down toasts, unread badges.
- Economic calendar (NFP/CPI/PPI/FOMC) with countdowns; signals pause window around events.
- Admin dashboard: approve/deny/block users, change plans, send notifications, change theme/logo/wallpaper/app name globally via `app_settings`.

## Technical notes
- TwelveData key will be stored as a server secret, never shipped to the browser. Signal generation runs server-side on a schedule (cron-style endpoint) and writes to `signals` table; client subscribes via Supabase realtime.
- AI Scanner uses Lovable AI Gateway (no key needed from you).
- Yoco needs your `YOCO_SECRET_KEY` — I'll prompt for it when we reach Phase 4.
- Strategy details (your PDF) — upload anytime and I'll wire the prompt/logic to match.

## What I need from you to start
1. Confirm I should proceed with Phase 1 now (enables Lovable Cloud — creates a backend automatically).
2. Confirm the TwelveData key in your message can be stored as a server secret (recommended over hardcoding).
3. The Yoco key + your PDF strategy can come later.

Reply "go" and I'll start building Phase 1 immediately.
