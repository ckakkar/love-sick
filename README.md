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
| `/` | Public | Landing page; “Get Started” can open OAuth dialog or link to `/login`. |
| `/login` | Public | **Digital Letter** magic-link login: enter email, “Send Letter,” receive link in inbox. |
| `/assess` | Public | Two-step love language assessment (giving / receiving), 1–10 sliders; saves to DB when logged in. |
| `/dashboard` | Protected | Main app: Prologue gate (if linked and not yet written), then Radar, Digital Garden, heatmap, Sync with partner, AI insight. |
| `/onboarding` | Protected | First-time: set username, name, age, sex. Required before dashboard. |
| `/invite?code=xyz` | Public | Legacy link flow; partner linking is now via username from dashboard. |
| `/auth/callback` | System | Handles OAuth and magic-link callback; exchanges code for session and redirects to `/dashboard` (or `?next=`). |

---

## Features

### Authentication

- **Magic link (primary):** `/login` uses `signInWithOtp({ email })`; user receives a link that hits `/auth/callback` and signs them in.
- **OAuth (optional):** Google sign-in via `signInWithOAuth`; same callback.
- **Session:** Supabase SSR middleware refreshes the session on each request; protected routes (e.g. dashboard layout) redirect unauthenticated users (e.g. to `/?signin=1` or `/login`).

### Assessment

- **Steps:** “How you express love” (giving) and “How you need to receive love” (receiving).
- **Dimensions:** Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, Physical Touch (each 1–10).
- **UI:** Sliders with violet gradient feedback; step indicator; Framer Motion transitions.
- **Storage:** Latest assessment per user is stored in `assessments` (giving_scores, receiving_scores as JSONB).

### Prologue (unlock gate)

- **When:** If the user has a linked partner and has not yet submitted a prologue for that partner, the dashboard is covered by a blurred overlay and a modal.
- **Prompt:** “Data is meaningless without intent. To unlock your compatibility profile, write at least 150 characters about why you chose this person.”
- **Flow:** User submits → `POST /api/prologue` → row in `prologues` → overlay fades out over 1.5s and dashboard is revealed.

### Dashboard (after unlock or when no partner)

- **Radar chart:** “The Fingerprint” — your giving scores (and partner’s if linked) on a spider chart (Recharts).
- **Digital Garden:** Procedural plant (SVG + Framer Motion): roots depth = Touch, stem height = Time, leaf count = Words, flower color = Service (yellow) / Gifts (purple). **Pick a leaf:** click sends a “digital_leaf” interaction to the partner and shows a toast.
- **Heatmap:** 5×5 grid of giving vs receiving intensity (violet/violet tints).
- **Connect with partner:** Invite by username (friend-request style). Enter partner’s username to send invite; they see it under “Invite requests” and can Accept/Decline. New users are prompted to take the assessment first.
- **AI insight (when linked):** “Generate insight” runs the dual-AI pipeline and shows a “Relationship Prescription” and three non-consumerist date ideas.

### Heartbeat Sync

- **Realtime presence** on a channel per couple (`room:${coupleId}`).
- **When partner is online:** Dashboard border glows amber (`sync-glow`), a heartbeat icon pulses in the header, and a toast appears: “She is here with you.”

### Onboarding and partner invite (by username)

- **First login:** If the profile has no username, user is redirected to `/onboarding` to set username, full name, age, and sex. These are stored on `profiles`.
- **Invite by username:** From dashboard, user enters their partner's username and sends an invite. Partner sees the request under "Invite requests" and can Accept or Decline. Accepting creates the couple (profile_a = inviter, profile_b = acceptor).
- **New users:** If the user has no assessment yet, the dashboard shows a prominent "Take the assessment" card.
- **Limit:** A user can only be in one couple (as A or B). Legacy `/invite?code=...` is still supported.

### AI (Romantic Essentialist)

- **Analyst (DeepSeek):** Consumes both partners’ giving/receiving scores; returns top variances and a “love deficit” style summary; forbidden from consumerist suggestions.
- **Coach (OpenAI):** Turns that analysis into a short, witty “Relationship Prescription” and exactly three actionable, non-consumerist ideas (e.g. handwritten letter, blanket fort, custom playlist).
- **Trigger:** “Generate insight” button on dashboard when both partners have assessments.

---

## Database schema

### Tables (after both migrations)

| Table | Purpose |
|-------|---------|
| **profiles** | One row per `auth.users`; `display_name`, `avatar_url`, `bio`, `username` (unique), `full_name`, `age`, `sex`. Created by trigger on signup; username/name/age/sex set in onboarding. |
| **partner_requests** | Friend-request style: `from_user_id`, `to_user_id`, `status` (pending/accepted/rejected). Accepting creates a couple. |
| **couples** | Links two users: `profile_a_id`, `profile_b_id`, `status` (pending/active), `invite_code` (legacy), `anniversary_date`. |
| **assessments** | Per user: `giving_scores`, `receiving_scores` (JSONB: words, service, gifts, time, touch, 1–10), `created_at`. |
| **invite_codes** | Optional table for one-time codes; invite code can also live on `couples.invite_code`. |
| **prologues** | One row per (user, partner): `content` (150+ chars) to unlock dashboard for that couple. |
| **interactions** | E.g. `type: 'digital_leaf'` when user “sends a leaf” to partner; used for toasts/activity. |

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
| PATCH | `/api/profile` | Body: `{ username?, full_name?, age?, sex? }`. Update own profile (onboarding). |
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
| `getCoupleInsight(...)` | `app/actions/insight.ts` | Calls `generateCoupleInsight` (DeepSeek + OpenAI) and returns analyst + coach result for dashboard. |

---

## Design system

- **Theme:** “Purple Heart” / Deep Electric Violet; dark by default.
- **Background:** `slate-950` (`#020617`).
- **Primary:** `violet-600` (`#7c3aed`).
- **Accent / deep:** Deep purple tones (`#2e1065`, `#1e1b4b`).
- **Sync state only:** Amber `#fbbf24` for Heartbeat Sync border/glow.
- **Typography:** Serif (Playfair Display) for headings; Geist Sans for body.
- **CSS variables:** Defined in `app/globals.css` and wired via Tailwind `@theme inline` (e.g. `--color-background`, `--font-serif`).
- **Utilities:** `.glass` (backdrop blur + border), `.gradient-mesh` (violet radial gradients), `.card-hover` (lift + shadow on hover), `.sync-glow` (amber glow), `.font-serif` for headings.

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
│   │   │   ├── auth.ts          # loginWithMagicLink
│   │   │   └── insight.ts      # getCoupleInsight
│   │   ├── api/
│   │   │   ├── interactions/route.ts
│   │   │   ├── invite/accept/route.ts
│   │   │   ├── invite/create/route.ts
│   │   │   └── prologue/route.ts
│   │   ├── assess/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard-client.tsx
│   │   │   ├── layout.tsx      # protected, redirect if no user
│   │   │   └── page.tsx
│   │   ├── invite/
│   │   │   ├── invite-client.tsx
│   │   │   └── page.tsx
│   │   ├── login/page.tsx      # Digital Letter magic link
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # landing
│   ├── components/
│   │   ├── auth/login-dialog.tsx
│   │   ├── digital-garden.tsx
│   │   ├── prologue-modal.tsx
│   │   └── ui/ (button, card, skeleton)
│   ├── hooks/
│   │   └── use-presence.ts    # Supabase Realtime partner presence
│   ├── lib/
│   │   ├── ai/insight.ts       # generateCoupleInsight (DeepSeek + OpenAI)
│   │   ├── supabase/client.ts, server.ts, middleware.ts
│   │   └── utils.ts            # cn()
│   ├── middleware.ts         # Supabase session refresh
│   └── types/
│       └── assessment.ts      # LoveScores, keys, labels
└── supabase/
    └── migrations/
        ├── 001_schema.sql
        └── 002_prologues_interactions.sql
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
