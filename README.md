# Love Sick

**Romance is Creation, not Consumption.**

A relationship intelligence web app for two people in a relationship: rate the five love languages (giving and receiving), connect via a link, unlock your dashboard with a written “prologue,” explore a procedural Digital Garden, see when your partner is online (Heartbeat Sync), and get anti-consumerist AI insights on how to love each other better.

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
- [Design system](#design-system)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Learn more](#learn-more)

---

## Philosophy

- **Romance is creation, not consumption.** The app avoids commercial tropes: no red/pink Valentine clichés, no “buy gifts” or expensive-date suggestions.
- **Pay with words.** The dashboard is locked behind a “Prologue”: you must write 150+ characters about why you chose your partner before seeing compatibility data.
- **Two people only.** Each user can be linked with at most one partner at a time; connection is via a shareable link, not UIDs.
- **AI as “Romantic Essentialist.”** Suggestions favor creation (handwritten letters, blanket forts, custom playlists) over consumption (dinners, trips, gifts).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Server Actions) |
| **Language** | TypeScript (strict) |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue, Realtime) |
| **Styling** | Tailwind CSS v4, clsx, tailwind-merge |
| **UI** | Radix primitives (Shadcn-style), Framer Motion, Lucide React |
| **Charts** | Recharts |
| **AI** | DeepSeek (analysis), OpenAI GPT-4o (coaching) |

---

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- A Supabase project
- (Optional) DeepSeek and OpenAI API keys for AI insights

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

---

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com).

2. **Authentication**
   - **Magic link (OTP):** Built-in; ensure **Email** is enabled.
   - **OAuth (optional):** Under Authentication → Providers, enable **Google** and/or **GitHub** and add credentials if you use the login dialog on the landing page.

3. **URL configuration** (critical for production OAuth)
   - **Site URL:** Set to your **production** URL when deployed (e.g. `https://love-sick-tawny.vercel.app`). If this stays as `http://localhost:3000`, Google/GitHub sign-in will redirect users to localhost after auth.
   - **Redirect URLs:** Add **both**:
     - `https://your-production-domain.vercel.app/auth/callback` (or your real production URL)
     - `http://localhost:3000/auth/callback` (for local dev)
   - In Vercel (or your host), set `NEXT_PUBLIC_APP_URL` to that same production URL so the auth callback redirects to the correct domain.

4. **Realtime (for Heartbeat Sync)**
   - Enable **Realtime** for the project (Dashboard → Database → Replication).

5. **Run migrations** in the SQL Editor, in order:
   - `supabase/migrations/001_schema.sql` — core tables, RLS, trigger, indexes.
   - `supabase/migrations/002_prologues_interactions.sql` — prologues and interactions.
   - `supabase/migrations/003_profiles_username_partner_requests.sql` — profile username/name/age/sex, partner_requests table, get_user_id_by_username, get_partner_requests_with_usernames.
   - `supabase/migrations/004_notifications_avatars.sql` — notification preferences (notify_partner_request, notify_partner_online), avatars storage bucket and RLS. If the bucket insert fails, create a public bucket `avatars` in Supabase Dashboard → Storage.

---

## Installation and run

```bash
git clone <repo-url>
cd love-sick
cp .env.example .env.local
# Edit .env.local with your Supabase and optional AI keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page; hero, auto-cycling feature cards, “What you get” grid; Sign in → `/login`. |
| `/login` | Public | “Enter the garden” — Google OAuth or magic link; redirects to `/dashboard` or `?next=`. |
| `/assess` | Public | Two-step love language assessment (giving / receiving), 1–10 elastic sliders; saves to DB when logged in. |
| `/dashboard` | Protected | Bento grid: Prologue gate (if linked, unwritten), then Weathervane, Time Difference, Streak, Partner presence, Fingerprint (radar/bar), Receiving (radar/bar), Digital Garden, Intensity grid, Connect with partner, AI insight (couple or solo). |
| `/dashboard/settings` | Protected | Profile photo upload, profile (username, name, age, sex), notification preferences (partner invite, partner online). |
| `/onboarding` | Protected | First-time: 4-step stepper — username, name, age, sex. Required before dashboard. |
| `/invite?code=xyz` | Public | Legacy invite link; if logged in and is partner, accept and redirect; else “Sign in to join” with login dialog. |
| `/auth/callback` | System | Handles OAuth and magic-link callback; exchanges code for session and redirects to `/dashboard` (or `?next=`). |

---

## Features

### Landing page

- **Hero:** Tagline “Know how you love. See how you match.” with gradient mesh background and soft ambient glows.
- **Auto-cycling feature cards (CardSwap):** Four cards (Five love languages, Your fingerprint, Digital garden, AI that gets you) cycle with a 3D stack animation; responsive sizing for mobile and desktop.
- **What you get:** Grid summary (five languages, fingerprint + gap analysis, AI insights); responsive 1–3 columns.
- **Sign in:** Links to `/login`; optional OAuth dialog from landing.

### Authentication

- **Magic link (primary):** `/login` — “Enter the garden” — uses `signInWithOtp({ email })`; user receives a link that hits `/auth/callback` and signs them in.
- **OAuth (optional):** Google sign-in via `signInWithOAuth`; same callback. Can be triggered from landing or invite flow via `LoginDialog`.
- **Session:** Supabase SSR middleware refreshes the session on each request; protected routes (e.g. dashboard layout) redirect unauthenticated users to `/login` or `/?signin=1`.

### Onboarding

- **First login:** If the profile has no username, user is redirected to `/onboarding`.
- **Stepper (4 steps):** (1) Choose username (letters, numbers, underscores, hyphens; partner uses this to send invite), (2) Full name, (3) Age (optional), (4) Sex (optional). Stored on `profiles`.
- **Validation:** Username ≥ 3 characters; name required; age 1–120 if provided.

### Assessment

- **Steps:** “How you express love” (giving) and “How you need to receive love” (receiving).
- **Dimensions:** Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, Physical Touch (each 1–10).
- **UI:** Elastic sliders with violet gradient, step indicator, Framer Motion transitions; responsive layout and touch-friendly.
- **Storage:** Latest assessment per user is stored in `assessments` (giving_scores, receiving_scores as JSONB).

### Dashboard (bento grid, responsive)

- **Prologue gate:** If the user has a linked partner and has not yet submitted a prologue, the dashboard is covered by a blurred overlay and a modal. Prompt: “Data is meaningless without intent” — write ≥ 150 characters about why you chose this person. Submit → `POST /api/prologue` → overlay fades out and dashboard is revealed.
- **Take the assessment card:** Shown when the user has no assessment; links to `/assess`.
- **Weathervane card:** Placeholder for “your location vs partner’s” weather (concept card).
- **Time Difference card:** Placeholder for time-zone or “time together” (concept card).
- **Streak counter card:** Placeholder for engagement streak (concept card).
- **Partner presence card (when linked):** Heart icon and “Partner here / away” using Heartbeat Sync.
- **The Fingerprint:** Your giving scores (and partner’s if linked) — **Radar** or **Bar** chart toggle (Recharts); responsive height.
- **How you need to receive love:** Same radar/bar toggle for receiving scores; you vs partner when linked.
- **Digital Garden:** Procedural plant (SVG + Framer Motion): roots depth = Touch, stem height = Time, leaf count = Words, flower color = Service (yellow) / Gifts (purple). **Pick a leaf** to send a “digital_leaf” interaction to your partner; toast: “Leaf sent to your partner.”
- **Intensity grid (heatmap):** 5×2 table — giving (top row) and receiving (bottom row) per love language (1–10); violet intensity shading.
- **Connect with your partner:** Invite by username. Your username is shown so you can share it; enter partner’s username to send invite. Partner sees “Invite requests” and can Accept/Decline. Pending (sent) invites listed. Accepting creates the couple.
- **AI insight (when linked, both have assessments):** “Generate insight” runs the dual-AI pipeline and shows a “Relationship Prescription” and three non-consumerist date ideas.
- **Solo AI insights (when not linked, has assessment):** “Get my insights” runs a solo pipeline: personal prescription and three ideas for self-love and readiness to love others; “Regenerate insight” to refresh.

### Heartbeat Sync (realtime presence)

- **Channel:** One presence channel per couple: `room:${coupleId}` (Supabase Realtime).
- **When partner is online:** Dashboard border glows amber (`sync-glow`), heartbeat icon pulses in header and in the partner card, toast: “Your partner is here with you.”

### Settings (`/dashboard/settings`)

- **Profile photo:** Upload avatar (JPEG, PNG, GIF, WebP; max 2MB). Stored in Supabase Storage bucket `avatars`; visible to partner when linked.
- **Profile:** Edit username, full name, age, sex (same as onboarding).
- **Notifications:** Toggles for “Partner invite requests” and “Partner is online” (Heartbeat Sync). Stored on `profiles` as `notify_partner_request`, `notify_partner_online`. Save profile or “Save notification preferences” to apply.

### Invite flow (legacy and username)

- **By username (primary):** From dashboard, send invite by partner’s username; partner accepts/declines from dashboard.
- **Legacy link:** `/invite?code=xyz` — if logged in and is the intended partner, auto-accepts and can redirect to assess or dashboard; if not logged in, shows “Sign in to join” with login dialog.

### AI (Romantic Essentialist)

- **Couple insight (when linked):** Analyst (DeepSeek) consumes both partners’ giving/receiving scores; returns variances and summary. Coach (OpenAI) produces a “Relationship Prescription” and three non-consumerist ideas (e.g. handwritten letter, blanket fort, custom playlist).
- **Solo insight (no partner):** Personal prescription and three ideas for self-growth and readiness to love; same anti-consumerist stance.
- **Fallbacks:** If DeepSeek or OpenAI keys are missing, fallback responses are used.

---

## Database schema

### Tables (after all migrations)

| Table | Purpose |
|-------|---------|
| **profiles** | One row per `auth.users`; `display_name`, `avatar_url`, `bio`, `username` (unique), `full_name`, `age`, `sex`, `notify_partner_request`, `notify_partner_online`. Created by trigger on signup; username/name/age/sex set in onboarding; notification prefs and avatar in settings. |
| **partner_requests** | Friend-request style: `from_user_id`, `to_user_id`, `status` (pending/accepted/rejected). Accepting creates a couple. |
| **couples** | Links two users: `profile_a_id`, `profile_b_id`, `status` (pending/active), `invite_code` (legacy), `anniversary_date`. |
| **assessments** | Per user: `giving_scores`, `receiving_scores` (JSONB: words, service, gifts, time, touch, 1–10), `created_at`. |
| **invite_codes** | Optional table for one-time codes; invite code can also live on `couples.invite_code`. |
| **prologues** | One row per (user, partner): `content` (150+ chars) to unlock dashboard for that couple. |
| **interactions** | E.g. `type: 'digital_leaf'` when user “sends a leaf” to partner; used for toasts/activity. |

### Storage

| Bucket | Purpose |
|--------|---------|
| **avatars** | Profile photos; public read; authenticated users upload/update/delete only their own (path: `{user_id}/...`). Max 2MB; JPEG, PNG, GIF, WebP. |

### Row-level security (RLS)

- **profiles:** Read/update own; read partner’s when in same couple.
- **couples:** Read/update own couple; insert as inviter.
- **assessments:** Full CRUD own; read partner’s when in same couple.
- **prologues:** Insert/read own; read where user is partner.
- **interactions:** Insert own; read where user is sender or partner.

### Indexes

- Couples: `profile_a_id`, `profile_b_id`, `invite_code`.
- Assessments: `user_id`, `(user_id, created_at DESC)`.
- Prologues: `(user_id, partner_id)`.
- Interactions: `(partner_id, created_at DESC)`.

---

## API routes and server actions

### API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/callback` | Exchanges `code` for session, redirects to `next` or `/dashboard`. |
| POST | `/api/prologue` | Body: `{ content, partner_id }`. Ensures content ≥150 chars; upserts into `prologues`. |
| POST | `/api/interactions` | Body: `{ type: "digital_leaf", partner_id }`. Inserts into `interactions`. |
| GET | `/api/profile` | Returns current user’s profile (username, full_name, age, sex, avatar_url, notify_*). |
| PATCH | `/api/profile` | Body: `{ username?, full_name?, age?, sex?, notify_partner_request?, notify_partner_online? }`. Update own profile. |
| POST | `/api/profile/avatar` | Multipart: `avatar` (file). Uploads to `avatars` bucket, updates `profiles.avatar_url`. |
| POST | `/api/partner-invite/send` | Body: `{ username }`. Send partner invite by username. |
| GET | `/api/partner-invite/list` | Returns `{ sent, received }` pending invites with usernames. |
| POST | `/api/partner-invite/accept` | Body: `{ request_id }`. Accept invite and create couple. |
| POST | `/api/partner-invite/decline` | Body: `{ request_id }`. Decline invite. |
| POST | `/api/invite/create` | (Legacy) Creates couple row with `invite_code`. |
| POST | `/api/invite/accept` | (Legacy) Body: `{ code }`. Links current user as partner via code. |

### Server actions

| Action | File | Description |
|--------|------|-------------|
| `loginWithMagicLink(formData)` | `app/actions/auth.ts` | Reads `email` and `origin`; calls `supabase.auth.signInWithOtp` with `emailRedirectTo: ${origin}/auth/callback`. |
| `getCoupleInsight(...)` | `app/actions/insight.ts` | Calls `generateCoupleInsight` (DeepSeek + OpenAI); returns coach result for dashboard. |
| `getSoloInsight(giving, receiving)` | `app/actions/insight.ts` | Calls `generateSoloInsight`; returns personal prescription + three ideas for users without a partner. |

---

## Design system

- **Theme:** “Purple Heart” / Deep Electric Violet; dark by default.
- **Background:** Deep base (`#0a0812`); foreground `#f8f6ff` (soft lavender-white).
- **Primary:** Violet (`#a78bfa`); card/secondary tones in `globals.css`.
- **Sync state only:** Amber `--sync-glow` for Heartbeat Sync border/glow.
- **Typography:** Serif (Playfair Display) for headings; Geist Sans for body.
- **CSS variables:** Defined in `app/globals.css` and wired via Tailwind `@theme inline` (e.g. `--color-background`, `--font-serif`).
- **Utilities:** `.glass` (backdrop blur + border), `.gradient-mesh` (violet radial gradients), `.card-hover` (lift + shadow on hover), `.sync-glow` (amber glow), `.font-serif` for headings, `.dashboard-bg` (aurora + noise).
- **Responsive:** Viewport meta and safe-area support; bento grid 1 col (mobile) → 2 col (tablet) → 4 col (desktop); charts, cards, and modals scale for small laptops and phones.

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
│   │   │   ├── auth.ts              # loginWithMagicLink
│   │   │   └── insight.ts           # getCoupleInsight, getSoloInsight
│   │   ├── api/
│   │   │   ├── interactions/route.ts
│   │   │   ├── invite/accept/route.ts
│   │   │   ├── invite/create/route.ts
│   │   │   ├── partner-invite/accept/route.ts
│   │   │   ├── partner-invite/decline/route.ts
│   │   │   ├── partner-invite/list/route.ts
│   │   │   ├── partner-invite/send/route.ts
│   │   │   ├── profile/avatar/route.ts
│   │   │   ├── profile/route.ts      # GET, PATCH
│   │   │   └── prologue/route.ts
│   │   ├── assess/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard-client.tsx # bento grid, charts, garden, partner invite, AI
│   │   │   ├── layout.tsx           # protected, DashboardShell
│   │   │   ├── page.tsx
│   │   │   └── settings/page.tsx    # profile photo, profile, notifications
│   │   ├── invite/invite-client.tsx, page.tsx
│   │   ├── login/page.tsx
│   │   ├── onboarding/layout.tsx, page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                  # landing, CardSwap
│   ├── components/
│   │   ├── auth/login-dialog.tsx    # OAuth (Google) dialog
│   │   ├── card-swap.tsx            # auto-cycling 3D cards
│   │   ├── dashboard/
│   │   │   ├── streak-counter-card.tsx
│   │   │   ├── time-difference-card.tsx
│   │   │   └── weathervane-card.tsx
│   │   ├── dashboard-shell.tsx      # header, avatar, nav, sign out
│   │   ├── digital-garden.tsx
│   │   ├── elastic-slider.tsx       # assessment sliders
│   │   ├── prologue-modal.tsx
│   │   ├── stepper.tsx              # onboarding steps
│   │   ├── ui/ (button, card, skeleton, sex-selector)
│   │   └── ...
│   ├── hooks/
│   │   └── use-presence.ts           # Supabase Realtime partner presence
│   ├── lib/
│   │   ├── ai/insight.ts             # generateCoupleInsight, generateSoloInsight
│   │   ├── supabase/client.ts, server.ts, middleware.ts
│   │   └── utils.ts                  # cn()
│   └── types/
│       └── assessment.ts            # LoveScores, keys, labels
└── supabase/
    └── migrations/
        ├── 001_schema.sql
        ├── 002_prologues_interactions.sql
        ├── 003_profiles_username_partner_requests.sql
        └── 004_notifications_avatars.sql
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm run start` | Run production server. |
| `npm run lint` | Run ESLint. |

---

## Deployment

1. Set all required (and desired optional) env vars in your host (Vercel, etc.).
2. Set **Site URL** and **Redirect URLs** in Supabase to your production domain (including `/auth/callback`).
3. Optionally set `NEXT_PUBLIC_APP_URL` to your production URL for magic-link redirects.
4. Run `npm run build` and deploy the output; ensure Realtime is allowed if you use Heartbeat Sync.

---

## Learn more

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Recharts](https://recharts.org/)
- [Framer Motion](https://www.framer.com/motion/)
