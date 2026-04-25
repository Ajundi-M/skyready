@AGENTS.md

# CLAUDE.md — SkyReady AI Context File

> This file is the single source of truth for any AI tool working on this codebase.
> Read it completely before touching any file. It replaces the need to re-explain
> context in every session.

---

## 1. What Is SkyReady?

SkyReady is a **web-based pilot aptitude training platform** built for a real user (Sarah)
with a real deadline (Week 23, 2026 — UiT Luftfartsfag bachelor selection).

- Live at: `train.aljundi.me`
- Access model: **invite-only** — 48-hour single-use codes
- Supabase project ID: `nsaukesczkadlcdrbfoq`
- GitHub repo: `github.com/Ajundi-M/skyready`
- Domain registrar: name.com → CNAME → `cname.vercel-dns.com`

**sarah.aljundi.me is explicitly out of scope for Phase 1. Do not build it.**

---

## 2. Tech Stack

| Layer        | Choice                                                                                                       | Notes                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Framework    | Next.js (App Router)                                                                                         | **Next.js 16** convention applies — see Section 5                                                                   |
| Language     | TypeScript 5 strict mode                                                                                     | `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `useUnknownInCatchVariables` — zero `any` in production |
| Auth & DB    | Supabase                                                                                                     | `@supabase/supabase-js`, `@supabase/ssr`                                                                            |
| Styling      | Tailwind CSS v4 + shadcn/ui v4.2.0                                                                           | Nova preset, Radix primitives                                                                                       |
| Validation   | Zod v4                                                                                                       | Used on all API route inputs                                                                                        |
| Charts       | Recharts                                                                                                     | Phase 1 only — no TanStack Query yet                                                                                |
| Testing      | Vitest                                                                                                       |                                                                                                                     |
| CI           | GitHub Actions                                                                                               | `.github/workflows/ci.yml`                                                                                          |
| Deployment   | Vercel                                                                                                       | Reads from GitHub                                                                                                   |
| Code quality | ESLint 9 flat config + `@typescript-eslint/recommendedTypeChecked`, Prettier, Husky, lint-staged, Commitlint |                                                                                                                     |

---

## 3. The Most Important Rule: Understand-First Gate

**Neo (the developer) will not commit any code he cannot explain line by line.**

This is not optional. It is the central discipline of this project.

- Before generating code: explain what you are about to write and why
- After generating code: be ready to explain every line if asked
- If a file is complex, flag the complexity before writing it
- Never generate black-box solutions. Always generate understandable solutions, even if they are slightly more verbose

The understanding gate is **not** about line count. It is about comprehension of complexity.

---

## 4. How Neo Works (Workflow)

```
Cursor (generates code)
    ↓
Claude Pro (reviews, mentors, Neo must understand before saving)
    ↓
Neo commits only code he can explain
    ↓
GitHub ← Vercel reads from here
```

- **Cursor** is used for code generation (`@codebase`, `@file` for context)
- **Claude Pro** (claude.ai) is the mentor and review layer
- **Antigravity IDE** is used in Editor view ONLY — never Manager/autonomous mode (it bypasses the understanding gate)
- **Claude Code** (this CLI) is used for file inspection and targeted edits

---

## 5. Critical Naming Convention — DO NOT CHANGE

> ⚠️ This is the single most important convention in the codebase. It has caused bugs before.

SkyReady uses a **Next.js 16 convention** where:

- The middleware file is named **`proxy.ts`** at the project root (NOT `middleware.ts`)
- The exported function is named **`proxy`** (NOT `middleware`)
- The internal Supabase SSR helper lives at **`lib/supabase/proxy.ts`**

**NEVER suggest renaming `proxy.ts` to `middleware.ts`.** This is intentional and understood.

---

## 6. Secrets & Security Rules

| Rule                                        | Detail                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Never use `NEXT_PUBLIC_` prefix for secrets | `SUPABASE_SERVICE_ROLE_KEY` is server-side only — always                                                                                             |
| Service role key bypasses RLS entirely      | Only used in server-side API routes                                                                                                                  |
| `.env.local` is never committed             | `.gitignore` excludes all `.env*` except `.env.example`                                                                                              |
| A real security incident happened           | Service role key was accidentally exposed in chat mid-build. It was revoked and replaced with the new `sb_secret` format. This is why we are strict. |
| Public repo is fine                         | Secrets are kept out of git, not out of GitHub                                                                                                       |

**Supabase auth debugging pattern:** Use `get_logs` with `service="auth"` — that is the primary tool.
Direct password reset via `crypt()` is reliable when email rate limits are hit.

---

## 7. Database Schema

### profiles

```sql
id           uuid PRIMARY KEY REFERENCES auth.users
display_name text
is_admin     boolean DEFAULT false
```

### sessions

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid NOT NULL REFERENCES profiles(id)
module       text NOT NULL DEFAULT 'vigilance'
started_at   timestamptz DEFAULT now()
completed_at timestamptz        -- null if abandoned
duration_s   integer
score        integer
accuracy     numeric(5,2)       -- 0.00–100.00
metrics      jsonb DEFAULT '{}'  -- module-specific data
```

### invite_codes

```sql
code         text PRIMARY KEY   -- e.g. 'X7K9-M3P2-NQ84'
created_by   uuid NOT NULL REFERENCES profiles(id)
used         boolean DEFAULT false
used_by      uuid REFERENCES profiles(id)
used_at      timestamptz
expires_at   timestamptz NOT NULL  -- created_at + 48 hours
created_at   timestamptz DEFAULT now()
```

### Invite code format

- Pattern: `X7K9-M3P2-NQ84` (12 chars, 3 groups of 4, separated by hyphens)
- Character set excludes: `0`, `O`, `1`, `I` (to prevent visual confusion)
- Expiry: 48 hours from generation
- Single-use: claimed atomically on successful signup

### metrics JSONB shape — Vigilance module

```json
{
  "skips_encountered": 47,
  "skips_detected": 39,
  "false_presses": 3,
  "move_interval_ms": 500,
  "circle_count": 50
}
```

### RLS Policies

| Table        | Policy                      | Rule                                                  |
| ------------ | --------------------------- | ----------------------------------------------------- |
| profiles     | SELECT, UPDATE              | `id = auth.uid()`                                     |
| sessions     | SELECT, INSERT, UPDATE      | `user_id = auth.uid()`                                |
| invite_codes | SELECT (validate on signup) | `used = false AND expires_at > now()`                 |
| invite_codes | INSERT (generate)           | `created_by = auth.uid() AND profile.is_admin = true` |
| invite_codes | UPDATE (mark used)          | Server-side only via service_role key                 |

**RLS is enabled on all tables. Never disable it.**

---

## 8. Folder Structure

```
skyready/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
    (app)/
      layout.tsx              ← Protected layout, redirects if not authed
      dashboard/page.tsx
      train/
        page.tsx              ← Module selection
        vigilance/page.tsx    ← Vigilance exercise
      admin/
        page.tsx              ← Admin panel (redirects non-admins)
    api/
      sessions/
        route.ts              ← GET + POST
        [id]/route.ts         ← GET + PATCH
      admin/
        invites/
          route.ts            ← GET list + POST generate
          [code]/route.ts     ← DELETE
      auth/
        validate-invite/route.ts
    layout.tsx
    page.tsx                  ← Root redirect
  components/
    ui/                       ← shadcn/ui — DO NOT EDIT
    vigilance/
      VendingRing.tsx         ← Canvas animation
      ScoreDisplay.tsx        ← Live score + timer HUD
      SessionSummary.tsx      ← End screen
    dashboard/
      ScoreChart.tsx
      AccuracyChart.tsx
      SessionTable.tsx
      StatsCards.tsx
    admin/
      InviteCodesTable.tsx
      GenerateInviteButton.tsx
      UsersTable.tsx
    nav/
      TopNav.tsx
  lib/
    supabase/
      client.ts               ← Browser client
      server.ts               ← Server client (API routes)
      proxy.ts                ← Internal SSR helper
    invite.ts                 ← Code generation logic
    types.ts
    utils.ts
  proxy.ts                    ← ROOT MIDDLEWARE (named proxy.ts, NOT middleware.ts)
  supabase/
    migrations/
```

---

## 9. API Routes Reference

### Session routes (authenticated)

| Method | Route                | Purpose                                                                  |
| ------ | -------------------- | ------------------------------------------------------------------------ |
| POST   | `/api/sessions`      | Create new session row. Returns session id.                              |
| PATCH  | `/api/sessions/[id]` | Update on completion: score, accuracy, metrics, completed_at, duration_s |
| GET    | `/api/sessions`      | Fetch own sessions DESC. Supports `?module=` and `?limit=`               |
| GET    | `/api/sessions/[id]` | Fetch single session. Returns 403 if belongs to different user.          |

### Invite code routes (admin only)

| Method | Route                       | Purpose                                                        |
| ------ | --------------------------- | -------------------------------------------------------------- |
| POST   | `/api/admin/invites`        | Generate new invite code. Sets `expires_at = now() + 48h`.     |
| GET    | `/api/admin/invites`        | List all codes with status: unused / used / expired            |
| DELETE | `/api/admin/invites/[code]` | Delete an unused code                                          |
| POST   | `/api/auth/validate-invite` | **Public** — check code validity. Returns `{ valid, reason }`. |

`/api/auth/validate-invite` is intentionally public — it runs before the user has an account.
Rate-limit this endpoint: max 10 requests per IP per minute.

---

## 10. Signup Flow (Invite Validation Sequence)

This is a common gate question. Know it exactly:

1. Check invite code exists in `invite_codes` where `used = false AND expires_at > now()`. If invalid → return 400. **Stop. Do not create the user.**
2. Call Supabase Auth to create the user (email + password)
3. Auth trigger creates `profiles` row automatically
4. Update `invite_codes`: set `used = true`, `used_by = new user id`, `used_at = now()`
5. Return success. User is logged in.

**Why validate before creating the user?** If the code check happened after user creation and something failed, you'd have an orphan Supabase Auth account with no invite record. Checking first means a failed code never touches Supabase Auth at all.

---

## 11. Vigilance Module — Game Mechanics

### Initialisation

- 50 circles equidistant around a ring of radius 300px, centred on canvas
- Circle draw radius: `dist_between_centres × 0.35`
- Active dot radius: `draw_radius − 5px`
- Start position: index 0 (top of ring)

### Move logic

- Default interval: 500ms
- Each tick: roll random float 0–1
  - If `roll < 0.15`: **skip** — advance `current_idx` by 2 (mod 50)
  - If `roll >= 0.15`: **normal** — advance `current_idx` by 1 (mod 50)

### Scoring

- Spacebar during skip frame AND `waiting_for_input = true` → `score += 1`, `waiting_for_input = false`
- Spacebar during non-skip frame → `score -= 1` (false alarm)
- Skip frame ends with `waiting_for_input` still true (missed) → `score -= 1`
- Score is **not** clamped — it can go negative

### Visual rendering

- All circle outlines: white, 2px stroke, unfilled
- Active dot: filled — **red during skip frame, white during normal frame**
- HUD: score and countdown timer in top-left
- Canvas background: black

### Why Canvas and not React state?

React state re-renders are too slow for 60fps game loop animation. Canvas via `useRef` + `requestAnimationFrame` is the correct pattern. `requestAnimationFrame` is tied to the browser's screen refresh — more reliable than `setInterval`.

### Session lifecycle

- Session row created in DB when user clicks Start
- Abandoned tab: session remains with `completed_at = null`
- Timer reaching zero: show end screen
- 'Save and finish' triggers the PATCH request — **not automatic**

---

## 12. Key Technical Decisions

| Decision             | Choice                               | Why                                                                  |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Exercise rendering   | HTML Canvas via `useRef`             | 60fps animation — React state too slow                               |
| Game loop            | `requestAnimationFrame`              | Native browser loop, tied to screen refresh                          |
| Router               | App Router (Next.js)                 | Server Components, better data fetching                              |
| Auth                 | Supabase Auth (email/password)       | Built into stack. Free tier handles volume.                          |
| Invite codes         | Custom token table                   | Full control, auditable, no third-party                              |
| Code format          | 12-char alphanumeric, 3 groups       | Unguessable but typeable                                             |
| Code expiry          | 48 hours                             | Convenient but not hoardable                                         |
| Charts               | Recharts                             | React-native, simple API, good enough for Phase 1                    |
| Client data fetching | Native `fetch` in `useEffect`        | No TanStack Query yet — simpler to understand. Add in Phase 2.       |
| JSONB metrics        | Flexible column per module           | Each module defines its own shape. Sessions table never changes.     |
| SSR auth main value  | Server-side auth gate + key security | Not raw performance — that was an early misconception, now corrected |

---

## 13. Bugs Encountered and Resolved

These have already been fixed. Do not reintroduce them.

| Bug                      | Root cause                                        | Fix                                                       |
| ------------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| Missing dashboard route  | Route group not set up correctly                  | Added `(app)/dashboard/page.tsx`                          |
| Incorrect redirect logic | `proxy.ts` redirect condition was inverted        | Fixed condition in `proxy` function                       |
| `searchParams` crash     | Next.js 15+ requires `searchParams` to be awaited | Added `async/await` handling in page component            |
| Service role key exposed | Accidentally pasted in chat                       | Revoked immediately, replaced with new `sb_secret` format |

---

## 14. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL — safe for browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key — safe for browser
NEXT_PUBLIC_SITE_URL=            # e.g. https://train.aljundi.me
SUPABASE_SERVICE_ROLE_KEY=       # SECRET — server-side only, NEVER NEXT_PUBLIC_
```

Live in `.env.local` locally, Vercel environment settings in production. Never in git.

---

## 15. Deployment Flow

```
Neo's Mac → GitHub → Vercel
```

Vercel reads from GitHub. It does not connect directly to the local machine.
Commits exist locally before push to GitHub. GitHub and Vercel are downstream.

### Domain setup

- Domain registered at name.com
- DNS: CNAME record `train` → `cname.vercel-dns.com`
- SSL: Vercel provisions automatically — nothing to configure

---

## 16. Build Order (Phase 1)

Each step has an understanding gate. Move to the next only when the gate is passed.

| Step | Task                                                                                                      | Status  |
| ---- | --------------------------------------------------------------------------------------------------------- | ------- |
| 1    | Next.js project, TypeScript strict mode                                                                   | ✅ Done |
| 2    | ESLint, Prettier, Husky, lint-staged, Commitlint                                                          | ✅ Done |
| 3    | Supabase connected, migrations ran, RLS enabled                                                           | ✅ Done |
| 4    | shadcn/ui v4.2.0, Tailwind, Nova preset                                                                   | ✅ Done |
| 5    | Auth pages: login, signup with invite code, server actions, route group layouts, dashboard, root redirect | ✅ Done |
| 6    | API routes (sessions CRUD)                                                                                | 🔲 Next |
| 7    | Admin panel (invite codes + users)                                                                        | 🔲      |
| 8    | VendingRing canvas component                                                                              | 🔲      |
| 9    | Scoring logic and HUD                                                                                     | 🔲      |
| 10   | Session summary + save flow                                                                               | 🔲      |
| 11   | Dashboard charts and stats                                                                                | 🔲      |
| 12   | Connect custom domain train.aljundi.me                                                                    | 🔲      |
| 13   | README, final review, deploy                                                                              | 🔲      |

---

## 17. Phase 1 Acceptance Criteria

Phase 1 is complete when **all** of the following are true:

**Functional:**

- User with valid invite code can sign up, verify email, and log in
- Expired or used codes are rejected with clear error
- Logged-in user can start and complete a Vigilance session
- Spacebar scoring rules work correctly
- Session results save after 'Save and finish'
- Dashboard shows real data from DB
- A user cannot see another user's session data
- Refresh keeps the user logged in
- Admin can generate, view, and delete invite codes
- Non-admins cannot access `/admin`

**Technical:**

- TypeScript — zero `any` in production code
- ESLint passes with zero errors
- RLS enabled on all tables
- No secret key exposed in client-side code
- App deployed and live at train.aljundi.me
- README complete

---

## 18. Future Modules (Phase 2+)

Adding a new module requires **zero changes** to the database schema or dashboard.
Every module writes the same result shape to `sessions`.

| #   | Module                    | Domain                  | Phase         |
| --- | ------------------------- | ----------------------- | ------------- |
| 1   | Vigilance                 | Cognitive               | Phase 1 — now |
| 2   | Mental rotation           | Spatial                 | Phase 2       |
| 3   | Instrument reading        | Spatial/Cognitive       | Phase 2       |
| 4   | Tracking / cursor control | Psychomotor             | Phase 2       |
| 5   | Dual-task                 | Psychomotor + Cognitive | Phase 3       |
| 6   | Working memory            | Cognitive               | Phase 3       |
| 7   | Logical reasoning         | Cognitive               | Phase 3       |
| 8   | Mental arithmetic         | Cognitive               | Phase 3       |

---

## 19. What Not To Do

- ❌ Never rename `proxy.ts` to `middleware.ts`
- ❌ Never use `NEXT_PUBLIC_` prefix on `SUPABASE_SERVICE_ROLE_KEY`
- ❌ Never use the browser Supabase client in API routes
- ❌ Never commit `.env.local`
- ❌ Never use `any` type in production TypeScript
- ❌ Never use `setInterval` for the game loop — use `requestAnimationFrame`
- ❌ Never edit files in `components/ui/` — those are shadcn/ui managed files
- ❌ Never build sarah.aljundi.me — it is out of Phase 1 scope
- ❌ Never generate code Neo cannot explain — the understanding gate is non-negotiable

---

## 20. Reference Links

- Next.js App Router: https://nextjs.org/docs/app
- Supabase Auth (Next.js SSR): https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- shadcn/ui: https://ui.shadcn.com
- Recharts: https://recharts.org/en-US/api
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Vercel custom domains: https://vercel.com/docs/projects/domains/add-a-domain
- Claude Code memory docs: https://docs.anthropic.com/en/docs/claude-code/memory

---

_Last updated: April 2026 — Phase 1, Steps 1–5 complete._
