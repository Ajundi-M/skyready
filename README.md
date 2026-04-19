# SkyReady — Vigilance Training Platform

An invite-only web application for aviation vigilance training. Users complete timed detection exercises that mirror the psychomotor vigilance tests used in fatigue research and operational readiness assessments.

> **Portfolio project** — built to demonstrate full-stack Next.js + Supabase development with a focus on security, correctness, and production-grade code quality.

---

## Screenshots

| Dashboard                                    | Training Session                         | Admin Panel                          |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------ |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Session](docs/screenshots/session.png) | ![Admin](docs/screenshots/admin.png) |

_(placeholder — real screenshots coming soon)_

---

## What It Does

- **Invite-only registration** — admins generate time-limited, single-use invite codes; users cannot self-register
- **Vigilance exercise** — a dot rotates around a ring at a fixed cadence; it occasionally skips a beat; users must press a key each time they detect a skip
- **Two modes** — _Training_ (visual skip indicator) and _Exam_ (detection by position only, closer to real test conditions)
- **Session analytics** — score, accuracy, skips detected, false presses, and duration tracked per session and surfaced on the dashboard
- **Admin panel** — generate/revoke invite codes; view all registered users

---

## Tech Stack

| Layer              | Choice                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| Framework          | [Next.js 16](https://nextjs.org) (App Router, Server Actions, Route Handlers)   |
| Auth + DB          | [Supabase](https://supabase.com) (Postgres + GoTrue)                            |
| Styling            | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Language           | TypeScript 5 (strict mode)                                                      |
| Runtime validation | [Zod](https://zod.dev)                                                          |
| Fonts              | [Geist](https://vercel.com/font) via `next/font`                                |

---

## Architecture

### Auth Flow

```
User submits signup form
  → Server Action validates invite code (pre-flight SELECT)
  → supabase.auth.signUp() creates the auth user
  → claim_invite_code() Postgres function atomically marks the code used
      (single UPDATE — eliminates TOCTOU race between check and mark-used)
  → If claim fails (code already taken): auth user is deleted via admin API
  → Supabase sends confirmation email → user clicks link → can now sign in
```

### Invite Flow

```
Admin opens /admin → generates code via POST /api/admin/invites
  → Postgres stores: code (XXXX-XXXX-XXXX), expires_at (+48 h), used=false
Admin shares code out-of-band
User enters code at signup → atomically claimed on successful registration
```

### Session Lifecycle

```
User starts session → POST /api/sessions → returns session ID
User plays the vigilance exercise (client-side canvas, keydown detection)
Session ends (timer or user stops) → PATCH /api/sessions/[id]
  → validated by Zod schema (duration, score, accuracy, metrics bounds)
  → stored in sessions table; dashboard aggregates on next load
```

### Data Model (key tables)

```
profiles        id, display_name, is_admin          — extends auth.users
invite_codes    code, used, used_by, used_at, expires_at
sessions        id, user_id, module, started_at, completed_at,
                duration_s, score, accuracy, metrics (jsonb)
```

---

## Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/your-username/skyready.git
cd skyready
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable                        | Description                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (anon) key                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service-role key (server-only)                             |
| `NEXT_PUBLIC_SITE_URL`          | Canonical URL of your deployment (e.g. `https://train.example.com`) |

### 3. Database migrations

Run the SQL files in `supabase/migrations/` against your Supabase project in order:

```bash
# via Supabase CLI (if installed)
supabase db push

# or paste each file manually in the Supabase SQL editor
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create the first admin

After your first user signs up (you'll need an invite code — generate one via SQL directly on first run):

```sql
UPDATE profiles SET is_admin = true WHERE id = '<your-user-uuid>';
```

Then use `/admin` to generate further invite codes normally.

---

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start dev server (Turbopack) |
| `npm run build` | Production build             |
| `npm run lint`  | ESLint                       |

---

## License

MIT
