# Love Sick

**Romance is Creation, not Consumption.**

A relationship intelligence web app for two people: rate the five love languages (giving and receiving), connect via username or link, unlock your dashboard with a written “prologue,” view each other’s prologue notes, explore a procedural Digital Garden, see when your partner is online (Heartbeat Sync), and get anti-consumerist AI insights on how to love each other better.

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

- **Site URL:** Set to your **production** URL when deployed (e.g. `https://love-sick-tawny.vercel.app`).
- **Redirect URLs:** Add:
  - `https://your-production-domain.vercel.app/auth/callback` (or your real production URL)
  - `http://localhost:3000/auth/callback` (for local dev)
- In your host (e.g. Vercel), set `NEXT_PUBLIC_APP_URL` to that same production URL so the auth callback works.

### 4. Realtime (Heartbeat Sync)

- **Realtime** must be enabled for the project (Supabase Dashboard → Project Settings → API, or Database → Replication). Presence does **not** require database replication—only the Realtime feature.

### 5. Run migrations (in order)

Run these in the Supabase SQL Editor, in order:

| Migration | Purpose |
|------------|---------|
| `001_schema.sql` | Core tables (profiles, couples, assessments, invite_codes), RLS, trigger, indexes |
| `002_prologues_interactions.sql` | Prologues (unlock gate), interactions (e.g. digital_leaf) |
| `003_profiles_username_partner_requests.sql` | Profile username, full_name, age, sex; partner_requests; get_user_id_by_username, get_partner_requests_with_usernames |
| `004_notifications_avatars.sql` | notify_partner_request, notify_partner_online; avatars storage bucket and RLS (create bucket `avatars` in Storage if insert fails) |
| `005_couples_accept_policy.sql` | RLS so the **acceptor** of a partner invite can insert the couple row (required for Accept to work) |
| `006_notifications_unlink_delete.sql` | partner_notifications table (unlink reason, partner_left_app) |

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

**Quick start:** Sign in (magic link or Google) → complete onboarding (username, name, age, sex) → take the assessment (two steps: giving and receiving) → from the dashboard, invite a partner by username or open an invite link.

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page: hero, auto-cycling feature cards, “What you get” grid, sign in |
| `/login` | Public | “Enter the garden” — magic link or Google; redirects to `/dashboard` or `?next=` |
| `/assess` | Public | Two-step love language assessment (giving then receiving); 1–10 per dimension; +/− buttons and drag; saves when logged in |
| `/dashboard` | Protected | Bento grid: Prologue gate (if linked, unwritten), Prologues card, charts (you vs partner), Digital Garden, AI insights, connect partner, etc. |
| `/dashboard/settings` | Protected | Profile photo, profile, notifications, relationship messages, unlink (50-word reason), delete account |
| `/onboarding` | Protected | First-time: username, name, age, sex; required before dashboard |
| `/invite?code=xyz` | Public | Legacy invite; if logged in and is partner, accept and redirect; else “Sign in to join” |
| `/auth/callback` | System | OAuth / magic-link callback; exchanges code for session, redirects to `/dashboard` or `?next=` |

---

## Features

### Landing page

- **Hero:** Tagline “Know how you love. See how you match.” with gradient mesh and soft glows.
- **Auto-cycling feature cards (CardSwap):** Four cards (Five love languages, Your fingerprint, Digital garden, AI that gets you) cycle with a 3D stack animation.
- **What you get:** Grid summary; responsive 1–3 columns.
- **Sign in:** Links to `/login`; optional OAuth dialog from landing.

### Authentication

- **Magic link:** `/login` uses `signInWithOtp({ email })`; user receives a link → `/auth/callback` → signed in.
- **OAuth:** Google via `signInWithOAuth`; same callback. Triggered from landing or invite via `LoginDialog`.
- **Session:** Supabase SSR middleware refreshes the session; protected routes redirect unauthenticated users to `/login` or `/?signin=1`.

### Onboarding

- **First login:** If the profile has no username, redirect to `/onboarding`.
- **Stepper (4 steps):** (1) Username (partner uses this to send invite), (2) Full name, (3) Age (optional), (4) Sex (optional). Stored on `profiles`.
- **Validation:** Username ≥ 3 characters; name required; age 1–120 if provided.

### Assessment

- **Steps:** “How you express love” (giving) and “How you need to receive love” (receiving).
- **Dimensions:** Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, Physical Touch (each 1–10).
- **UI:** Elastic sliders with violet gradient; **− and + buttons** to decrement/increment by step (1); drag on track to set value; step indicator; Framer Motion step transitions. Responsive and touch-friendly.
- **Storage:** On submit, latest assessment is stored in `assessments` (giving_scores, receiving_scores as JSONB). Redirect to dashboard; solo users see animated preliminary insights.

### Dashboard (bento grid)

- **Layout:** Bento grid (1 col mobile → 2 col tablet → 4 col desktop), staggered Framer Motion entrance, gradient-mesh + aurora/noise background. When partner is online, outer container gets **amber sync-glow** border.
- **Toasts:** Bottom-center for “Your partner is here with you” and “Leaf sent to your partner”; auto-dismiss.
- **Prologue gate:** If linked and you haven’t submitted a prologue, dashboard is covered by a blurred overlay and modal: “Data is meaningless without intent” — write ≥ 150 characters about why you chose this person. Submit → `POST /api/prologue` → overlay fades, dashboard revealed; page refreshes so Prologues card appears.
- **Prologues card (when linked):** “Why I chose you” (your note) and “Why they chose you” (partner’s note). Shown when at least one prologue exists; partner’s section shows a message if they haven’t written yet.
- **Take the assessment:** Shown when the user has no assessment; links to `/assess`.
- **Weathervane / Time Difference / Streak:** Placeholder concept cards.
- **Partner presence (when linked):** Heart icon and “Partner here / away” via Heartbeat Sync.
- **The Fingerprint:** Your giving scores (and partner’s if linked). **Radar** or **Bar** toggle. **You** = violet; **Partner** = yellow/amber for readability.
- **How you need to receive love:** Same radar/bar toggle for receiving; you (violet) vs partner (yellow).
- **Digital Garden:** Procedural plant (roots = Touch, stem = Time, leaves = Words, flower = Service/Gifts). **Pick a leaf** to send a “digital_leaf” to your partner; toast: “Leaf sent to your partner.”
- **Intensity grid:** 5×2 heatmap (giving / receiving per language); violet shading.
- **Connect with your partner:** Invite by username; your username shown; partner accepts/declines from dashboard. Accepting creates the couple.
- **AI insight (when linked, both have assessments):** “Generate insight” → Relationship Prescription + three non-consumerist ideas.
- **Solo AI (when not linked, has assessment):** “Preview from your answers” (animated snapshot: top love languages + growth edge). “Get my insights” → full AI prescription + three ideas; “Regenerate insight” to refresh.

### Heartbeat Sync (partner presence)

- **Channel:** One presence channel per couple: `room:${coupleId}` (Supabase Realtime). Each client tracks `{ user_id: user.id }`; we consider the partner “online” if their `user_id` appears in presence state.
- **Hook:** `use-presence.ts` subscribes to the channel, listens for `sync` / `join` / `leave`, and calls `track()` after SUBSCRIBED. On unmount it calls `untrack()` then `removeChannel()` so the partner sees leave.
- **When partner is online:** Dashboard border glows amber (`sync-glow`), heartbeat icon pulses in header and partner card, toast: “Your partner is here with you.”

### Settings

- **Profile photo:** Upload avatar (JPEG, PNG, GIF, WebP; max 2MB) to `avatars` bucket; visible to partner when linked.
- **Profile:** Username, full name, age, sex (same as onboarding).
- **Notifications:** Toggles for “Partner invite requests” and “Partner is online”; save profile or “Save notification preferences.”
- **Relationship messages:** Unlink reason from partner or “partner left the app” (account deleted); “Mark as read.”
- **Unlink from partner:** Write ≥ 50 words (sent to partner); then couple is removed.
- **Delete account:** Type DELETE and confirm; if linked, partner is notified and unlinked; then auth user is deleted (requires `SUPABASE_SERVICE_ROLE_KEY`).

### Invite flow

- **By username:** Dashboard → enter partner’s username → send; partner sees request and Accept/Decline.
- **Legacy link:** `/invite?code=xyz` — if logged in and is the intended partner, accept and redirect; else “Sign in to join.”

### AI (Romantic Essentialist)

- **Couple (when linked):** DeepSeek analyst + OpenAI coach → Relationship Prescription + three non-consumerist ideas.
- **Solo (no partner):** Personal prescription + three ideas for self-growth and readiness to love.
- **Fallbacks:** If API keys are missing, fallback text is used.

---

## Database schema

### Tables (after all migrations)

| Table | Purpose |
|-------|---------|
| **profiles** | One per `auth.users`; display_name, avatar_url, bio, username (unique), full_name, age, sex, notify_partner_request, notify_partner_online. Created by trigger; username/name/age/sex from onboarding. |
| **partner_requests** | from_user_id, to_user_id, status (pending/accepted/rejected). Accepting creates a couple. |
| **couples** | profile_a_id, profile_b_id, status, invite_code (legacy), anniversary_date. |
| **assessments** | user_id, giving_scores, receiving_scores (JSONB: words, service, gifts, time, touch 1–10), created_at. |
| **invite_codes** | Optional one-time codes. |
| **prologues** | user_id, partner_id, content (150+ chars); unique (user_id, partner_id). |
| **interactions** | user_id, partner_id, type (e.g. digital_leaf), created_at. |
| **partner_notifications** | to_user_id, from_user_id, type (unlink_reason | partner_left_app), payload (e.g. { reason }), read_at. |

### Storage

| Bucket | Purpose |
|--------|---------|
| **avatars** | Profile photos; public read; RLS for upload/update/delete own. Max 2MB; JPEG, PNG, GIF, WebP. |

### Row-level security (RLS)

- **profiles:** Read/update own; read partner’s when in same couple.
- **couples:** Read/update own; insert as inviter (001) or as acceptor (005).
- **assessments:** Full CRUD own; read partner’s when in same couple.
- **prologues:** Insert/read own; read where user is partner.
- **interactions:** Insert own; read where sender or partner.
- **partner_notifications:** Select where to_user_id = auth.uid(); insert where from_user_id = auth.uid(); update read_at where to_user_id = auth.uid().

### Indexes

- Couples: profile_a_id, profile_b_id, invite_code.
- Assessments: user_id, (user_id, created_at DESC).
- Prologues: (user_id, partner_id).
- Interactions: (partner_id, created_at DESC).
- partner_notifications: (to_user_id, created_at DESC).

---

## API routes and server actions

### API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/callback` | Exchange code for session; redirect to `next` or `/dashboard`. |
| POST | `/api/prologue` | Body: `{ content, partner_id }`. Content ≥150 chars; upsert `prologues`. |
| POST | `/api/interactions` | Body: `{ type: "digital_leaf", partner_id }`. Insert interaction. |
| GET | `/api/profile` | Current user profile (username, full_name, age, sex, avatar_url, notify_*). |
| PATCH | `/api/profile` | Update profile fields and/or notification preferences. |
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
| POST | `/api/account/delete` | Body: `{ confirm: "DELETE" }`. Notify partner if linked, delete couple, delete auth user (needs `SUPABASE_SERVICE_ROLE_KEY`). |

### Server actions

| Action | File | Description |
|--------|------|-------------|
| `loginWithMagicLink(formData)` | `app/actions/auth.ts` | Magic link sign-in. |
| `getCoupleInsight(...)` | `app/actions/insight.ts` | DeepSeek + OpenAI couple insight. |
| `getSoloInsight(giving, receiving)` | `app/actions/insight.ts` | Solo AI prescription + ideas. |

---

## Design system & aesthetics

Dark, warm violet palette; no red/pink Valentine clichés. “Romance is Creation”: soft gradients, glassmorphism, serif headlines, subtle motion.

### Color palette

| Token | Hex | Usage |
|-------|-----|--------|
| `--background` | `#0a0812` | Page background. |
| `--foreground` | `#f8f6ff` | Primary text. |
| `--card` | `#12101a` | Card/popover. |
| `--primary` | `#a78bfa` | Buttons, links, focus. |
| `--muted` / `--muted-foreground` | `#1e1b28` / `#9d98b0` | Muted surfaces / secondary text. |
| `--border` | `#2a2638` | Borders. |
| `--sync-glow` | `#fcd34d` | Partner online (amber). |
| `--chart-1` … `--chart-5` | Violet → amber → emerald | Charts (you = violet, partner = amber in linked view). |

### Typography

- **Headings:** Playfair Display (`--font-playfair`).
- **Body:** Geist Sans (`--font-geist-sans`).
- **Mono:** Geist Mono. Utility: `.font-serif`.

### Motion & animation

- **Easing:** `--ease-out-expo`, `--ease-spring` in `globals.css`.
- **Framer Motion:** Bento stagger, assessment step transitions, prologue dissolve, toasts, chart tooltips, preliminary insight blocks.
- **CSS:** `shimmer`, `pulse-soft`, `aurora`, `fade-in`; `.dashboard-bg` aurora + noise.

### Utility classes (globals.css)

| Class | Effect |
|-------|--------|
| `.glass` | Backdrop blur, violet-tinted border. |
| `.gradient-mesh` | Violet radial gradients. |
| `.card-hover` | Hover lift + shadow. |
| `.sync-glow` | Amber border/glow when partner online. |
| `.dashboard-bg` | Aurora + noise overlay. |
| `.input-base` | Rounded inputs, violet focus. |
| `.safe-area-bottom` / `.safe-area-inset` | Notch / home indicator padding. |

### Layout

- **Viewport:** viewportFit cover, safe-area; max scale 5.
- **Bento:** `.bento-grid` — 4 / 2 / 1 columns; `.bento-cell.row-span-2` for large cards.
- **Charts:** Recharts; you = violet, partner = yellow when linked.
- **Modals:** Radix Dialog; unlink and delete-account use violet/red accents.

### Components

- **Buttons:** Primary (violet gradient), outline, ghost; `LoadingSpinner`.
- **Cards:** Shadcn-style; often `.glass` + `.card-hover`.
- **Elastic sliders:** Assessment; −/+ buttons and drag; violet gradient.
- **Digital Garden:** Procedural SVG plant; Framer Motion; pick leaf → send to partner.
- **Toasts:** Fixed bottom-center, glass, auto-dismiss.

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
│   │   │   ├── time-difference-card.tsx
│   │   │   └── weathervane-card.tsx
│   │   ├── dashboard-shell.tsx
│   │   ├── digital-garden.tsx
│   │   ├── elastic-slider.tsx
│   │   ├── prologue-modal.tsx
│   │   ├── stepper.tsx
│   │   └── ui/
│   ├── hooks/
│   │   └── use-presence.ts
│   ├── lib/
│   │   ├── ai/insight.ts
│   │   ├── supabase/admin.ts
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── supabase/middleware.ts
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
        └── 006_notifications_unlink_delete.sql
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
4. Run `npm run build` and deploy; ensure Realtime is enabled for Heartbeat Sync.

---

## Troubleshooting

- **Partner “Accept” does nothing:** Ensure migration `005_couples_accept_policy.sql` has been run (RLS allows acceptor to insert the couple row).
- **Heartbeat Sync not updating:** Realtime must be enabled for the project; no database replication needed for presence. Check browser console for channel errors.
- **Delete account returns 503:** Set `SUPABASE_SERVICE_ROLE_KEY` in your environment (server-side only).
- **OAuth redirects to localhost in production:** Set Site URL and Redirect URLs in Supabase to your production domain and set `NEXT_PUBLIC_APP_URL` in your host.

---

## Learn more

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Recharts](https://recharts.org/)
- [Framer Motion](https://www.framer.com/motion/)
