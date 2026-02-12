# Love Sick

**Romance is Creation, not Consumption.**

A relationship intelligence web app for two people: rate the five love languages (giving and receiving), connect via username or invite link, unlock your dashboard with a written “prologue,” see compatibility overlap (matched / one-sided / gap), answer deep-cut questions that unlock when you’ve both answered, see your and your partner’s local time, streak (days linked), and get AI insights that use your answers to suggest how to grow together — without the usual “buy this” noise.

---

## Table of contents

- [Philosophy](#philosophy)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Installation and run](#installation-and-run)
- [Routes](#routes)
- [Features](#features)
- [Database schema](#database-schema)
- [API routes and server actions](#api-routes-and-server-actions)
- [Realtime and dynamic updates](#realtime-and-dynamic-updates)
- [Account deletion and data removal](#account-deletion-and-data-removal)
- [Design system & aesthetics](#design-system--aesthetics)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Learn more](#learn-more)

---

## Philosophy

- **Romance is creation, not consumption.** The app avoids commercial tropes: no red/pink Valentine clichés, no “buy gifts” or expensive-date suggestions.
- **Pay with words.** The dashboard is locked behind a “Prologue”: you must write 150+ characters about why you chose your partner before seeing compatibility data.
- **Two people only.** Each user can be linked with at most one partner at a time; connection is via username invite or legacy shareable link.
- **AI as “Romantic Essentialist.”** Suggestions favor creation (handwritten letters, blanket forts, custom playlists) over consumption (dinners, trips, gifts). AI insights are supercharged by your Question Exchange (Deep Cuts) answers when linked.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Server Actions, Turbopack) |
| **Language** | TypeScript (strict) |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue, Realtime) |
| **Styling** | Tailwind CSS v4, clsx, tailwind-merge |
| **UI** | Radix primitives (Shadcn-style), Framer Motion, Lucide React |
| **Charts** | Recharts |
| **AI** | DeepSeek (analysis), OpenAI GPT-4o (coaching) |

---

## Prerequisites

- **Node.js 18+**
- **npm** (or pnpm / yarn)
- **Supabase project** — create one at [supabase.com](https://supabase.com)
- **Optional:** DeepSeek and OpenAI API keys for AI insights; Supabase **service role** key for account deletion

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Dashboard → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (Dashboard → Settings → API) |
| `NEXT_PUBLIC_APP_URL` | No | Full app URL (e.g. `https://yourapp.com`) for magic-link redirect when origin cannot be inferred |
| `DEEPSEEK_API_KEY` | No | DeepSeek API key for the “analyst” step; if missing, a fallback response is used |
| `OPENAI_API_KEY` | No | OpenAI API key for the “coach” step; if missing, a fallback response is used |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Required for account deletion (server-only; **never** expose in client). If missing, “Delete my account” returns 503. |

---

## Supabase setup

### 1. Create a project

Create a project at [supabase.com](https://supabase.com).

### 2. Authentication

- **Magic link (OTP):** Built-in; ensure **Email** is enabled under Authentication → Providers.
- **OAuth (optional):** Enable **Google** and/or **GitHub** under Authentication → Providers and add credentials for the login dialog.

### 3. URL configuration (critical for production OAuth)

- **Site URL:** Set to your **production** URL when deployed (e.g. `https://love-sick.vercel.app`).
- **Redirect URLs:** Add:
  - `https://your-production-domain.vercel.app/auth/callback` (or your real production URL)
  - `http://localhost:3000/auth/callback` (for local dev)
- In your host (e.g. Vercel), set `NEXT_PUBLIC_APP_URL` to that same production URL so the auth callback works.

### 4. Realtime

- **Presence:** Used for “partner online” (Heartbeat Sync); no extra config.
- **Postgres Changes:** Used for live notifications and Question Exchange updates. Run migration `010_realtime_publication.sql` so `partner_notifications` and `deep_cut_answers` are in the `supabase_realtime` publication (or add them in Dashboard → Database → Replication).

### 5. Run migrations (in order)

Run these in the Supabase SQL Editor, **in order**:

| Migration | Purpose |
|-----------|---------|
| `001_schema.sql` | Core tables (profiles, couples, assessments, invite_codes), RLS, trigger, indexes |
| `002_prologues_interactions.sql` | Prologues (unlock gate), interactions |
| `003_profiles_username_partner_requests.sql` | Profile username, full_name, age, sex; partner_requests; get_user_id_by_username, get_partner_requests_with_usernames |
| `004_notifications_avatars.sql` | notify_partner_request, notify_partner_online; avatars storage bucket and RLS (create bucket `avatars` in Storage if insert fails) |
| `005_couples_accept_policy.sql` | RLS so the **acceptor** of a partner invite can insert the couple row |
| `006_notifications_unlink_delete.sql` | partner_notifications table (unlink_reason, partner_left_app) |
| `007_profiles_timezone.sql` | profiles.timezone (IANA) for Time Difference card |
| `008_deep_cuts_question_exchange.sql` | deep_cut_questions (global prompts), deep_cut_answers (per user/couple); RLS; seed prompts |
| `009_account_deletion_cascade_notes.sql` | Documentation only: CASCADE behavior when user is deleted |
| `010_realtime_publication.sql` | Add partner_notifications and deep_cut_answers to supabase_realtime for live updates |

---

## Installation and run

```bash
git clone <repo-url>
cd love-sick
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key (and optional AI / service role keys)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Quick start:** Sign in (magic link or Google) → complete onboarding (username, name, age, sex, **timezone**) → take the assessment (giving and receiving) → from the dashboard, invite a partner by username or open an invite link.

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing: hero, feature cards (Five languages, Fingerprint, Question Exchange, AI), “What you get,” sign in |
| `/login` | Public | Magic link or Google; redirects to `/dashboard` or `?next=` |
| `/assess` | Public | Two-step love language assessment (giving then receiving); 1–10 per dimension; saves when logged in |
| `/dashboard` | Protected | Bento grid: Prologue gate (if linked, unwritten), Prologues, Fingerprint & Receiving charts, Question Exchange, Compatibility Overlap, Time Difference, Streak, AI insights, Connect partner |
| `/dashboard/settings` | Protected | Profile photo, profile (incl. timezone), notifications, relationship messages, unlink (50-word reason), delete account |
| `/onboarding` | Protected | First-time: username, name, age, sex, **timezone** (detected + dropdown); required before dashboard |
| `/invite?code=xyz` | Public | Legacy invite; if logged in and is partner, accept and redirect; else “Sign in to join” |
| `/auth/callback` | System | OAuth / magic-link callback; exchanges code for session, redirects |

---

## Features

### Landing page

- **Hero:** “Know how you love. See how you match.” with gradient mesh and soft glows.
- **Auto-cycling feature cards (CardSwap):** Four cards: Five love languages, Your fingerprint, Question Exchange, AI that gets you.
- **What you get:** One-line summary with dot separators.
- **Sign in:** Links to `/login`; optional OAuth dialog from landing.

### Authentication

- **Magic link:** `/login` uses `signInWithOtp({ email })`; user receives a link → `/auth/callback` → signed in.
- **OAuth:** Google via `signInWithOAuth`; same callback. Triggered from landing or invite via `LoginDialog`.
- **Session:** Supabase SSR middleware refreshes the session; protected routes redirect unauthenticated users to `/login` or `/?signin=1`.

### Onboarding

- **First login:** If the profile has no username, redirect to `/onboarding`.
- **Stepper (5 steps):** (1) Username, (2) Full name, (3) Age (optional), (4) Sex (optional), (5) **Where are you?** — timezone (browser-detected + dropdown by region). Stored on `profiles`.
- **Validation:** Username ≥ 3 characters; name required; age 1–120 if provided; timezone optional but recommended.

### Assessment

- **Steps:** “How you express love” (giving) and “How you need to receive love” (receiving).
- **Dimensions:** Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, Physical Touch (each 1–10).
- **UI:** Elastic sliders with violet gradient; −/+ buttons; drag on track; Framer Motion step transitions.
- **Storage:** Latest assessment in `assessments` (giving_scores, receiving_scores as JSONB). Scores are normalized (1–10 per key) for charts and AI.

### Dashboard (bento grid)

- **Layout:** Bento grid, staggered Framer Motion entrance, gradient-mesh + aurora/noise. When partner is online, outer container gets **amber sync-glow** border.
- **Toasts:** “Your partner is here with you,” “Answer submitted. Revealed when your partner answers too.”
- **Prologue gate:** If linked and you haven’t submitted a prologue, overlay + modal: write ≥ 150 characters about why you chose this person. Submit → overlay fades; `router.refresh()` so Prologues card appears.
- **Prologues card (when linked):** “Why I chose you” and “Why they chose you”; partner’s section shows a message if they haven’t written yet.
- **Take the assessment:** Shown when the user has no assessment; links to `/assess`.
- **Time Difference:** “Your time” (from profile timezone) and “Their time” (partner timezone when linked). When not linked, prompt to connect.
- **Streak:** When linked, shows **days linked** (from couple `updated_at`). When not linked, prompt to connect.
- **Partner presence (when linked):** Heart icon and “Partner here / away” via Heartbeat Sync (presence channel per couple).
- **The Fingerprint:** Your giving scores (and partner’s if linked). Radar or Bar toggle. You = violet; Partner = yellow/amber.
- **How you need to receive love:** Same radar/bar for receiving; you vs partner.
- **Question Exchange (Deep Cuts):** Progressive prompts (Week 1 → Month 6). Answer privately; when **both** have answered, both answers are revealed. Current question + textarea + submit; “Revealed” list below. Answers are used to **supercharge** couple AI insights.
- **Compatibility Overlap:** When linked, interpretative summary from scores: **Matched** (green) — “You both give and need [X] highly”; **One-sided** (yellow) — e.g. “You give Touch but they don’t need it much”; **Gap** (red) — e.g. “They need Words but you rarely give it.” When not linked, prompt to connect.
- **Connect with your partner:** Invite by username; your username shown; partner accepts/declines from dashboard. Accepting creates the couple.
- **AI insight (when linked, both have assessments):** “Generate insight” → Relationship Prescription + three non-consumerist ideas. Uses **revealed Deep Cuts answers** when available (`getCoupleInsight(..., coupleId)`).
- **Solo AI (when not linked, has assessment):** Full prescription + three ideas; optional `coupleId` so your Deep Cuts answers can supercharge solo insight when you later link.

### Heartbeat Sync (partner presence)

- **Channel:** One presence channel per couple: `room:${coupleId}`. Each client tracks `{ user_id }`; partner is “online” if their `user_id` is in presence state.
- **Hook:** `use-presence.ts` subscribes, listens for sync/join/leave, calls `track()` after SUBSCRIBED; on unmount `untrack()` then `removeChannel()`.
- **When partner is online:** Dashboard border glows amber, heartbeat icon pulses, toast: “Your partner is here with you.”

### Settings

- **Profile photo:** Upload to `avatars` bucket (max 2MB; JPEG, PNG, GIF, WebP); visible to partner when linked.
- **Profile:** Username, full name, age, sex, **timezone** (dropdown; used for Time Difference and planning).
- **Notifications:** Toggles for “Partner invite requests” and “Partner is online”; save profile or “Save notification preferences.”
- **Relationship messages:** Unlink reason from partner or “partner left the app”; “Mark as read.” List and badge update in **real time** via Realtime subscription.
- **Unlink from partner:** Write ≥ 50 words (sent to partner); then couple is removed. **Full page redirect** to `/dashboard` so data is fresh (no stale router cache).
- **Delete account:** Type DELETE and confirm; if linked, partner is notified and unlinked; **avatar files removed from storage**; then auth user is deleted (requires `SUPABASE_SERVICE_ROLE_KEY`). All related rows are removed by CASCADE (see [Account deletion](#account-deletion-and-data-removal)).

### Invite flow

- **By username:** Dashboard → enter partner’s username → send; partner sees request and Accept/Decline. Accept creates couple; `router.refresh()` so dashboard updates.
- **Legacy link:** `/invite?code=xyz` — if logged in and is the intended partner, accept and redirect; else “Sign in to join.” `router.refresh()` after accept.

### AI (Romantic Essentialist)

- **Couple (when linked):** DeepSeek analyst (variances, love deficit) + OpenAI coach (Relationship Prescription + three ideas). **Revealed Deep Cuts answers** are passed into the coach so insights reference the couple’s own words and fears.
- **Solo (no partner or with partner):** Personal prescription + three ideas. Optional **your** Deep Cuts answers (when `coupleId` passed) to personalize.
- **Fallbacks:** If API keys are missing, fallback text is used.

---

## Database schema

### Tables (after all migrations)

| Table | Purpose |
|-------|---------|
| **profiles** | One per `auth.users`; id, display_name, avatar_url, bio, username (unique), full_name, age, sex, **timezone** (IANA), notify_partner_request, notify_partner_online. Created by trigger. |
| **partner_requests** | from_user_id, to_user_id, status (pending/accepted/rejected). Accepting creates a couple. |
| **couples** | profile_a_id, profile_b_id, status, invite_code, invited_by_id, created_at, **updated_at** (used for “days linked”). |
| **assessments** | user_id, giving_scores, receiving_scores (JSONB: words, service, gifts, time, touch 1–10), created_at. |
| **invite_codes** | Optional one-time codes. |
| **prologues** | user_id, partner_id, content (150+ chars); unique (user_id, partner_id). |
| **interactions** | user_id, partner_id, type (e.g. digital_leaf), created_at. |
| **partner_notifications** | to_user_id, from_user_id, type (unlink_reason \| partner_left_app), payload (e.g. { reason }), read_at, created_at. |
| **deep_cut_questions** | id, prompt, stage_label, order_index. Global prompts (seeded). |
| **deep_cut_answers** | question_id, user_id, couple_id, content, created_at; unique (question_id, user_id, couple_id). Partner’s answer visible only when both have answered. |

### Storage

| Bucket | Purpose |
|--------|---------|
| **avatars** | Profile photos; path `{user_id}/avatar.{ext}`; public read; RLS for upload/update/delete own. Max 2MB; JPEG, PNG, GIF, WebP. |

### Row-level security (RLS)

- **profiles:** Read/update own; read partner’s when in same couple.
- **couples:** Read/update own; insert as inviter or acceptor (005).
- **assessments:** Full CRUD own; read partner’s when in same couple.
- **prologues:** Insert/read own; read where user is partner.
- **interactions:** Insert own; read where sender or partner.
- **partner_notifications:** Select where to_user_id = auth.uid(); insert where from_user_id = auth.uid(); update read_at where to_user_id = auth.uid().
- **deep_cut_questions:** Select for all authenticated.
- **deep_cut_answers:** Insert/update own; select where user_id = auth.uid() or in same couple (for API to return partner answer only when both answered).

### Indexes

- Couples: profile_a_id, profile_b_id, invite_code.
- Assessments: user_id, (user_id, created_at DESC).
- Prologues: (user_id, partner_id).
- Interactions: (partner_id, created_at DESC).
- partner_notifications: (to_user_id, created_at DESC).
- deep_cut_answers: (question_id, couple_id), (user_id, couple_id).
- deep_cut_questions: order_index.

---

## API routes and server actions

### API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/callback` | Exchange code for session; redirect to `next` or `/dashboard`. |
| POST | `/api/prologue` | Body: `{ content, partner_id }`. Content ≥150 chars; upsert `prologues`. |
| POST | `/api/interactions` | Body: `{ type: "digital_leaf", partner_id }`. Insert interaction. |
| GET | `/api/profile` | Current user profile (incl. **timezone**). |
| PATCH | `/api/profile` | Update profile fields (incl. **timezone**) and/or notification preferences. |
| POST | `/api/profile/avatar` | Multipart `avatar`; upload to `avatars`, update profile. |
| POST | `/api/partner-invite/send` | Body: `{ username }`. Send partner invite. |
| GET | `/api/partner-invite/list` | Pending sent/received invites with usernames. |
| POST | `/api/partner-invite/accept` | Body: `{ request_id }`. Accept and create couple. |
| POST | `/api/partner-invite/decline` | Body: `{ request_id }`. Decline. |
| POST | `/api/invite/create` | (Legacy) Create couple with invite_code. |
| POST | `/api/invite/accept` | (Legacy) Body: `{ code }`. Link as partner. |
| GET | `/api/couple` | `{ hasPartner, partnerId, coupleId }`. |
| GET | `/api/notifications` | `{ notifications }` (unlink_reason, partner_left_app). |
| PATCH | `/api/notifications` | Body: `{ id }`. Mark as read. |
| POST | `/api/partner-unlink` | Body: `{ reason }` (min 50 words). Notify partner, delete couple. |
| POST | `/api/account/delete` | Body: `{ confirm: "DELETE" }`. Notify partner if linked, delete couple, **delete user’s avatar files from storage**, delete auth user (needs `SUPABASE_SERVICE_ROLE_KEY`). |
| GET | `/api/deep-cuts?couple_id=...` | `{ questions }`: list of questions with myAnswer, partnerAnswer (only when both answered), revealed. |
| POST | `/api/deep-cuts` | Body: `{ question_id, couple_id, content }`. Upsert current user’s answer. |

### Server actions

| Action | File | Description |
|--------|------|-------------|
| `loginWithMagicLink(formData)` | `app/actions/auth.ts` | Magic link sign-in. |
| `getCoupleInsight(userGiving, userReceiving, partnerGiving, partnerReceiving, coupleId?)` | `app/actions/insight.ts` | Fetches **revealed** Deep Cuts for couple when `coupleId` provided; DeepSeek analyst + OpenAI coach with those answers. |
| `getSoloInsight(giving, receiving, coupleId?)` | `app/actions/insight.ts` | When `coupleId` provided, fetches **your** Deep Cuts answers and passes to solo coach. Solo prescription + three ideas. |

---

## Realtime and dynamic updates

- **Router refresh:** After mutations that affect server-rendered data (profile save, notification prefs, prologue submit, Question Exchange submit, partner invite accept/decline/send, mark notification read), the app calls `router.refresh()` so the next view has fresh server data.
- **Realtime notifications:** `useRealtimeNotifications(refetch)` in the dashboard shell subscribes to `partner_notifications` (INSERT/UPDATE where `to_user_id = me`). On event, refetches `/api/notifications` so the bell badge and list update without reload.
- **Realtime Deep Cuts:** `useRealtimeDeepCuts(coupleId, fetchQuestions)` in Question Exchange subscribes to `deep_cut_answers` (INSERT/UPDATE where `couple_id = coupleId`). When the partner submits an answer, the list refetches so “waiting for partner” can become “revealed” without reload.
- **Unlink:** After unlink, the app uses `window.location.assign("/dashboard")` so the dashboard is loaded from the server with no partner (avoids client router cache showing stale linked state).

**Migrations:** Run `010_realtime_publication.sql` so `partner_notifications` and `deep_cut_answers` are in the `supabase_realtime` publication. If a table is already in the publication, skip or remove that line.

---

## Account deletion and data removal

When a user deletes their account (`POST /api/account/delete` with `confirm: "DELETE"`):

1. **Notify partner** — Insert `partner_left_app` notification.
2. **Delete couple** — Removes the couple row (and CASCADE removes `deep_cut_answers` for that couple).
3. **Delete avatar storage** — Admin client lists `avatars/{user_id}/` and calls `remove()` (storage is not CASCADE’d by Postgres).
4. **Delete auth user** — `admin.auth.admin.deleteUser(user.id)`.

**CASCADE when auth user is deleted:** profiles, assessments, prologues (user_id or partner_id), interactions (user_id), partner_requests, partner_notifications (to_user_id), deep_cut_answers (user_id). Then profile deletion CASCADE: invite_codes (created_by_id), couples (profile_a_id). See `009_account_deletion_cascade_notes.sql` for the full list.

---

## Design system & aesthetics

Dark, warm violet palette; no red/pink Valentine clichés. “Romance is Creation”: soft gradients, glassmorphism, serif headlines, subtle motion.

### Color palette

| Token | Usage |
|-------|--------|
| `--background` | Page background. |
| `--foreground` | Primary text. |
| `--card` | Card/popover. |
| `--primary` | Buttons, links, focus (violet). |
| `--muted` / `--muted-foreground` | Muted surfaces / secondary text. |
| `--border` | Borders. |
| `--sync-glow` | Partner online (amber). |

### Typography

- **Headings:** Playfair Display (serif).
- **Body:** Geist Sans. Utility: `.font-serif`.

### Motion & animation

- Framer Motion: bento stagger, assessment steps, prologue dissolve, toasts, chart tooltips.
- CSS: shimmer, pulse-soft, aurora, fade-in; `.dashboard-bg` aurora + noise.

### Utility classes (globals.css)

| Class | Effect |
|-------|--------|
| `.glass` | Backdrop blur, violet-tinted border. |
| `.gradient-mesh` | Violet radial gradients. |
| `.card-hover` | Hover lift + shadow. |
| `.sync-glow` | Amber border/glow when partner online. |
| `.dashboard-bg` | Aurora + noise overlay. |

### Layout

- **Bento:** `.bento-grid` — 4 / 2 / 1 columns; `.bento-cell.row-span-2` for large cards.
- **Charts:** Recharts; you = violet, partner = yellow when linked.
- **Modals:** Radix Dialog; unlink and delete-account use violet/red accents.

### Key components

- **Buttons, Cards, Skeleton, LoadingSpinner, SexSelector** — UI primitives.
- **CardSwap** — Landing feature cards with 3D stack animation.
- **ElasticSlider** — Assessment sliders with −/+ and drag.
- **PrologueModal** — “Why you chose them” gate.
- **QuestionExchange** — Deep Cuts: current question, submit, revealed list; uses `useRealtimeDeepCuts`.
- **TimeDifferenceCard** — Your time + their time (from profile timezone).
- **StreakCounterCard** — Days linked (from couple `updated_at`).
- **dashboard-shell** — Header, nav, notifications (with `useRealtimeNotifications`), user menu.
- **Digital Garden** — Component exists (`digital-garden.tsx`, `use-plant-generator.ts`) but is not used on the dashboard (replaced by Question Exchange).

---

## Project structure

```
love-sick/
├── .env.example
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   └── insight.ts
│   │   ├── api/
│   │   │   ├── account/delete/route.ts
│   │   │   ├── couple/route.ts
│   │   │   ├── deep-cuts/route.ts
│   │   │   ├── interactions/route.ts
│   │   │   ├── invite/accept/route.ts
│   │   │   ├── invite/create/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   ├── partner-invite/{accept,decline,list,send}/route.ts
│   │   │   ├── partner-unlink/route.ts
│   │   │   ├── profile/route.ts
│   │   │   ├── profile/avatar/route.ts
│   │   │   └── prologue/route.ts
│   │   ├── assess/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard-client.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── invite/invite-client.tsx, page.tsx
│   │   ├── login/page.tsx
│   │   ├── onboarding/layout.tsx, page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/login-dialog.tsx
│   │   ├── card-swap.tsx
│   │   ├── dashboard/
│   │   │   ├── streak-counter-card.tsx
│   │   │   └── time-difference-card.tsx
│   │   ├── dashboard-shell.tsx
│   │   ├── digital-garden.tsx
│   │   ├── elastic-slider.tsx
│   │   ├── prologue-modal.tsx
│   │   ├── question-exchange.tsx
│   │   ├── stepper.tsx
│   │   └── ui/
│   ├── hooks/
│   │   ├── use-plant-generator.ts
│   │   ├── use-presence.ts
│   │   ├── use-realtime-deep-cuts.ts
│   │   └── use-realtime-notifications.ts
│   ├── lib/
│   │   ├── ai/insight.ts
│   │   ├── supabase/admin.ts, client.ts, middleware.ts, server.ts
│   │   ├── timezones.ts
│   │   └── utils.ts
│   └── types/
│       └── assessment.ts
└── supabase/
    └── migrations/
        ├── 001_schema.sql
        ├── 002_prologues_interactions.sql
        ├── 003_profiles_username_partner_requests.sql
        ├── 004_notifications_avatars.sql
        ├── 005_couples_accept_policy.sql
        ├── 006_notifications_unlink_delete.sql
        ├── 007_profiles_timezone.sql
        ├── 008_deep_cuts_question_exchange.sql
        ├── 009_account_deletion_cascade_notes.sql
        └── 010_realtime_publication.sql
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm run start` | Production server. |
| `npm run lint` | ESLint. |

---

## Deployment

1. Set env vars in your host (Vercel, etc.): at least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optionally AI keys and `SUPABASE_SERVICE_ROLE_KEY` for account deletion.
2. In Supabase: set **Site URL** and **Redirect URLs** to your production domain (including `/auth/callback`).
3. Set `NEXT_PUBLIC_APP_URL` to your production URL if using magic link.
4. Run all migrations (001–010); ensure Realtime is enabled and `010_realtime_publication.sql` has been applied for live notifications and Question Exchange updates.
5. Run `npm run build` and deploy.

---

## Troubleshooting

- **Partner “Accept” does nothing:** Ensure migration `005_couples_accept_policy.sql` has been run (RLS allows acceptor to insert the couple row).
- **Heartbeat Sync not updating:** Realtime must be enabled for the project. Check browser console for channel errors.
- **Notifications / Deep Cuts not updating in real time:** Run `010_realtime_publication.sql` so `partner_notifications` and `deep_cut_answers` are in the `supabase_realtime` publication.
- **Dashboard still shows partner after unlink:** The app uses a full page redirect after unlink; if you see stale data, hard refresh (F5). Dashboard page has `dynamic = "force-dynamic"`.
- **Charts show “all 10s” or wrong values:** Scores are normalized via `normalizeLoveScores()` (server and client); ensure assessments store valid JSONB with keys words, service, gifts, time, touch (1–10).
- **Delete account returns 503:** Set `SUPABASE_SERVICE_ROLE_KEY` in your environment (server-side only).
- **OAuth redirects to localhost in production:** Set Site URL and Redirect URLs in Supabase to your production domain and set `NEXT_PUBLIC_APP_URL` in your host.

---

## Learn more

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) (Presence and Postgres Changes)
- [Recharts](https://recharts.org/)
- [Framer Motion](https://www.framer.com/motion/)
