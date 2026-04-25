# SkyReady — Determination Test (DT) Module: Cursor Build Tasks

# Verified against repository source on 2026-04-24

> **How to use this file**
> Each task is a self-contained Cursor prompt. Copy the full block under
> **Cursor prompt** and paste it verbatim into Cursor (Sonnet model).
> Paste the output back to Claude for review before saving anything.
> Do NOT proceed to the next task until:
>
> 1. Claude has reviewed and approved the output.
> 2. You can answer the understanding gate out loud without looking at code.
> 3. `npm run lint && npm run build` passes with zero errors.

---

## Verified project facts (confirmed from source files)

```
Import alias : @/* maps to ./* (tsconfig.json paths)
               All imports must use @/ — never bare relative paths
Zod version  : 4.3.6 — z.record() takes (keySchema, valueSchema)
React version: 19.2.4
Next.js      : 16.2.2
Auth guard   : provided by app/(app)/layout.tsx — pages do NOT add their own
TopNav       : injected by the (app) layout — pages do NOT render it manually
Sessions POST: server-side sets user_id from session; client sends { module }
Sessions PATCH: validated by patchSessionSchema — DT needs its own schema
Zod import   : import { z } from 'zod'  (works for v4)
Supabase     : createClient() from @/lib/supabase/server (async, await required)
               createClient() from @/lib/supabase/client (sync, browser only)
               createServiceClient() from @/lib/supabase/service (service role)
Tests        : live in lib/__tests__/ (see lib/__tests__/session.test.ts)
Toast hook   : import { useToast } from '@/hooks/use-toast'
Train page   : app/(app)/train/page.tsx is a Server Component (no 'use client')
```

---

## Task 1 — Types and Constants

**Understanding gate — answer before running:**
`as const` freezes a literal. Why does `typeof DT_TIERS[number]` produce
`1 | 2 | 3` when the array is `as const`, but just `number` without it?

---

### Cursor prompt

```
Create the shared types and constants file for the Determination Test module.

ONLY create this one file. Do not touch any other file.

Create: lib/determination/types.ts

Contents — copy exactly, do not change anything:

// ── Stimulus tiers ──────────────────────────────────────────────
export const DT_TIERS = [1, 2, 3] as const;
export type DTTier = (typeof DT_TIERS)[number]; // 1 | 2 | 3

// ── Presentation modes ──────────────────────────────────────────
export const DT_MODES = ['action', 'reaction', 'adaptive'] as const;
export type DTMode = (typeof DT_MODES)[number];

// ── Stimulus names ──────────────────────────────────────────────
export const DT_STIMULI = [
  'red',
  'blue',
  'yellow',
  'green',
  'foot_left',
  'foot_right',
  'tone',
] as const;
export type DTStimulus = (typeof DT_STIMULI)[number];

// ── Active stimuli per tier ─────────────────────────────────────
export const DT_TIER_STIMULI: Record<DTTier, readonly DTStimulus[]> = {
  1: ['red', 'yellow'],
  2: ['red', 'blue', 'yellow', 'green'],
  3: ['red', 'blue', 'yellow', 'green', 'foot_left', 'foot_right', 'tone'],
};

// ── Tier display names ──────────────────────────────────────────
export const DT_TIER_NAMES: Record<DTTier, string> = {
  1: 'Beginner',
  2: 'Standard',
  3: 'Full Aviation',
};

// ── Tier short descriptions ─────────────────────────────────────
export const DT_TIER_DESCRIPTIONS: Record<DTTier, string> = {
  1: '2 stimuli · hands only',
  2: '4 stimuli · hands only',
  3: '7 stimuli · hands + feet + tone',
};

// ── Stimulus hex colours ────────────────────────────────────────
export const DT_STIMULUS_COLOUR: Record<DTStimulus, string> = {
  red:        '#DC2626',
  blue:       '#2563EB',
  yellow:     '#D97706',
  green:      '#16A34A',
  foot_left:  '#6B7280',
  foot_right: '#6B7280',
  tone:       '#FFFFFF',
};

// ── Stimulus limb labels ────────────────────────────────────────
export const DT_STIMULUS_LIMB: Record<DTStimulus, string> = {
  red:        'Left hand',
  blue:       'Left hand',
  yellow:     'Right hand',
  green:      'Right hand',
  foot_left:  'Left foot',
  foot_right: 'Right foot',
  tone:       'Either hand',
};

// ── Key map ─────────────────────────────────────────────────────
// Values are lowercase single characters from event.key.toLowerCase().
// Space bar is stored as a single space ' '.
export type DTKeyMap = Record<DTStimulus, string>;

export const DT_DEFAULT_KEY_MAP: DTKeyMap = {
  red:        's',
  blue:       'a',
  yellow:     'l',
  green:      'k',
  foot_left:  'z',
  foot_right: '/',
  tone:       ' ',
};

// ── Reserved keys that can never be remapped ────────────────────
export const DT_RESERVED_KEYS = new Set([
  'escape',
  'enter',
  'shift',
  'control',
  'alt',
  'meta',
  'tab',
  'capslock',
  'f1','f2','f3','f4','f5','f6',
  'f7','f8','f9','f10','f11','f12',
]);

// ── Timing constants (milliseconds) ────────────────────────────
export const DT_TIMING = {
  ACTION_ISI_MS:           300,
  REACTION_WINDOW_MS:      800,
  REACTION_ISI_MS:         400,
  ADAPTIVE_START_MS:      1200,
  ADAPTIVE_MIN_MS:         400,
  ADAPTIVE_MAX_MS:        2000,
  ADAPTIVE_FASTER_MS:       50,
  ADAPTIVE_SLOWER_MS:      100,
  ADAPTIVE_STREAK_TARGET:    3,
  ADAPTIVE_ISI_MS:         300,
  PRACTICE_DURATION_MS:  30_000,
} as const;

// ── Session durations per mode ──────────────────────────────────
export const DT_SESSION_DURATION_MS: Record<DTMode, number> = {
  action:   5 * 60 * 1000,
  reaction: 5 * 60 * 1000,
  adaptive: 8 * 60 * 1000,
};

// ── Mode descriptions ───────────────────────────────────────────
export const DT_MODE_DESCRIPTIONS: Record<DTMode, string> = {
  action:   'Unlimited window · accuracy focus',
  reaction: '800 ms window · fixed pace',
  adaptive: 'Dynamic pace · selection standard',
};

// ── Metric shapes ───────────────────────────────────────────────
export type DTStimulusMetric = {
  correct:    number;
  errors:     number;
  mean_rt_ms: number;
};

export type DTMetrics = {
  tier:             DTTier;
  mode:             DTMode;
  key_map_snapshot: DTKeyMap;
  correct:          number;
  delayed:          number;
  errors:           number;
  omissions:        number;
  total_stimuli:    number;
  mean_rt_ms:       number;
  median_rt_ms:     number;
  final_window_ms:  number | null; // null unless adaptive
  per_stimulus:     Record<DTStimulus, DTStimulusMetric>;
};

// ── User preferences shape (stored in profiles.preferences JSONB) ──
export type DTPreferences = {
  dt_keys?:      DTKeyMap;
  dt_last_tier?: DTTier;
  dt_last_mode?: DTMode;
};
```

Strict TypeScript is enabled. Zero type errors. No imports. No extra exports.

---

## Task 2 — Database Migration: preferences column

**Understanding gate — answer before running:**
`ADD COLUMN IF NOT EXISTS ... DEFAULT '{}'` runs on a live table that
already has rows. What value do existing rows receive, and does Postgres
need to rewrite the table on disk to add a column with a non-null default?
(Hint: think about how Postgres 11+ handles this differently from older versions.)

---

### Cursor prompt

```
Create a Supabase migration file.

ONLY create this one file. Do not touch any other file.

Create: supabase/migrations/20260425000000_add_preferences_to_profiles.sql

File contents — copy exactly:

-- Migration: add user preferences column to profiles
--
-- Existing rows receive '{}' automatically (Postgres 11+: no table rewrite).
-- RLS: no change needed — column inherits the existing row-level policy
-- (users can SELECT and UPDATE their own row only).
--
-- IMPORTANT: Always MERGE into this column, never replace the whole value.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN profiles.preferences IS
  'Application preference store. Shape is application-defined. '
  'Never store auth credentials here. '
  'Always merge incoming values — never overwrite the full column.';
```

---

## Task 3 — DT Session Schema

**Understanding gate — answer before running:**
The existing `patchSessionSchema` in `lib/schemas/session.ts` uses
`.strict()`. What does `.strict()` do, and why would the DT PATCH fail
if we tried to send DT metrics through the existing schema?

---

### Cursor prompt

```
Add a new Zod schema for Determination Test session PATCH requests.

ONLY modify this one file. Do not touch any other file.

File to modify: lib/schemas/session.ts

IMPORTANT — Zod version is 4.3.6. Use the v4 API:
  - z.record(keySchema, valueSchema) requires BOTH arguments in v4
  - z.union([...]) still works
  - All other z.* methods are unchanged

Add the following at the END of the existing file, after all existing
exports. Do not modify any existing code in the file.

// ─── Determination Test schema ────────────────────────────────────────────────

const dtStimulusMetricSchema = z.object({
  correct:    z.number().int().min(0),
  errors:     z.number().int().min(0),
  mean_rt_ms: z.number().min(0),
});

const dtStimulusSchema = z.enum([
  'red', 'blue', 'yellow', 'green',
  'foot_left', 'foot_right', 'tone',
]);

const dtKeyMapSchema = z.record(dtStimulusSchema, z.string().max(1));

const dtMetricsSchema = z.object({
  tier:             z.union([z.literal(1), z.literal(2), z.literal(3)]),
  mode:             z.enum(['action', 'reaction', 'adaptive']),
  key_map_snapshot: dtKeyMapSchema,
  correct:          z.number().int().min(0),
  delayed:          z.number().int().min(0),
  errors:           z.number().int().min(0),
  omissions:        z.number().int().min(0),
  total_stimuli:    z.number().int().min(0),
  mean_rt_ms:       z.number().min(0),
  median_rt_ms:     z.number().min(0),
  final_window_ms:  z.number().min(0).nullable(),
  per_stimulus:     z.record(dtStimulusSchema, dtStimulusMetricSchema),
});

export const patchDTSessionSchema = z.object({
  completed_at: z.string().datetime().optional(),
  duration_s:   z.number().int().min(0).max(3600),
  score:        z.number().int(),
  accuracy:     z.number().min(0).max(100),
  metrics:      dtMetricsSchema,
});

export type PatchDTSessionBody = z.infer<typeof patchDTSessionSchema>;
```

---

## Task 4 — Sessions API: support determination module

**Understanding gate — answer before running:**
The existing `POST /api/sessions` hardcodes `module: 'vigilance'`.
If we change it to accept a `module` field from the client, what new
validation do we need to prevent a bad actor from inserting arbitrary
module names into the database?

---

### Cursor prompt

```
Update the sessions POST route to accept a module parameter.

ONLY modify this one file. Do not touch any other file.

File to modify: app/api/sessions/route.ts

Current code inserts { user_id: user.id, module: 'vigilance', started_at: ... }.

Change 1: Parse an optional module from the request body.
  Accept only 'vigilance' or 'determination'. Default to 'vigilance' if absent.
  Use a simple inline validation — no new Zod schema needed here:

    let body: { module?: string } = {};
    try { body = (await request.json()) as { module?: string }; } catch {}
    const allowedModules = ['vigilance', 'determination'] as const;
    type AllowedModule = (typeof allowedModules)[number];
    const module: AllowedModule =
      allowedModules.includes(body.module as AllowedModule)
        ? (body.module as AllowedModule)
        : 'vigilance';

Change 2: Use the validated module value in the insert:
  Replace the hardcoded 'vigilance' with the validated `module` variable.

Do not change the GET handler or anything else in this file.
The response shape stays the same: { id: string }.
Zero 'any' types (use unknown for json parsing, then narrow).
```

---

## Task 5 — Sessions API: DT PATCH route

**Understanding gate — answer before running:**
The existing PATCH route at `app/api/sessions/[id]/route.ts` validates
the body with `patchSessionSchema`, which uses `.strict()` and only
accepts Vigilance metrics. Why can't we just add DT metrics fields to
the existing schema instead of creating a separate one?

---

### Cursor prompt

```
Update the sessions PATCH route to support both Vigilance and DT payloads.

ONLY modify this one file. Do not touch any other file.

File to modify: app/api/sessions/[id]/route.ts

The route already imports patchSessionSchema from @/lib/schemas/session.
Add an import for patchDTSessionSchema from the same file.

Current logic:
  const parsed = patchSessionSchema.safeParse(body);
  if (!parsed.success) { ... return 422 }
  const { completed_at, duration_s, score, accuracy, metrics } = parsed.data;

Replace that block with:

  // Try Vigilance schema first, then DT schema.
  // Both produce the same top-level fields; only the metrics shape differs.
  const vigilanceParsed = patchSessionSchema.safeParse(body);
  const dtParsed = !vigilanceParsed.success
    ? patchDTSessionSchema.safeParse(body)
    : null;

  if (!vigilanceParsed.success && !dtParsed?.success) {
    return Response.json(
      {
        error: 'Invalid payload',
        details: vigilanceParsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const { completed_at, duration_s, score, accuracy, metrics } =
    (vigilanceParsed.success ? vigilanceParsed : dtParsed!).data;

Everything else in the route stays exactly the same.
Zero 'any' types.
```

---

## Task 6 — Preferences API Route

**Understanding gate — answer before running:**
The route merges preferences with `{ ...existing, ...incoming }`.
Give a concrete example of a key that would be silently deleted if
you did `update({ preferences: incoming })` instead of merging.

---

### Cursor prompt

```
Create the API route that persists DT user preferences.

ONLY create this one file. Do not touch any other file.

Create: app/api/profile/preferences/route.ts

IMPORTANT — Zod version is 4.3.6. In Zod v4, z.record() requires two
arguments: z.record(keySchema, valueSchema).

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const dtStimulusSchema = z.enum([
  'red', 'blue', 'yellow', 'green',
  'foot_left', 'foot_right', 'tone',
]);

const schema = z.object({
  preferences: z.object({
    dt_keys: z
      .record(dtStimulusSchema, z.string().max(1))
      .optional(),
    dt_last_tier: z
      .union([z.literal(1), z.literal(2), z.literal(3)])
      .optional(),
    dt_last_mode: z
      .enum(['action', 'reaction', 'adaptive'])
      .optional(),
  }),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 },
    );
  }

  // Always merge — never replace — to preserve any unrelated preference keys.
  const existing =
    (profile?.preferences as Record<string, unknown> | null) ?? {};
  const merged = { ...existing, ...parsed.data.preferences };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ preferences: merged })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 },
    );
  }

  return NextResponse.json({ preferences: merged }, { status: 200 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();
  return NextResponse.json({
    preferences: (profile?.preferences as Record<string, unknown>) ?? {},
  });
}
```

---

## Task 7 — Game Engine Hook

**Understanding gate — answer before running:**
All mutable timing state lives in `useRef`, not `useState`. If
`stimulusOnsetTime` were stored in `useState` instead, what would
go wrong in the keydown handler when measuring reaction time?

---

### Cursor prompt

```
Create the game engine hook for the Determination Test.

ONLY create this one file. Do not touch any other file.

Create: lib/determination/useDTEngine.ts

Add 'use client' at the top — this hook uses browser APIs (RAF, Web Audio).

Imports:
  import { useCallback, useEffect, useRef, useState } from 'react';
  import {
    DT_DEFAULT_KEY_MAP,
    DT_STIMULI,
    DT_TIER_STIMULI,
    DT_TIMING,
    DT_SESSION_DURATION_MS,
    type DTEngineConfig,   // defined below — export from this file
    type DTEngineControls, // defined below — export from this file
    type DTEngineState,    // defined below — export from this file
    type DTKeyMap,
    type DTMetrics,
    type DTMode,
    type DTStimulus,
    type DTStimulusMetric,
    type DTTier,
  } from '@/lib/determination/types';

─── EXPORTED TYPES (add these to the file, then implement) ──────────────

export type DTEngineConfig = {
  tier:       DTTier;
  mode:       DTMode;
  keyMap:     DTKeyMap;
  isPractice: boolean;
  onComplete: (metrics: DTMetrics) => void;
};

export type DTEngineState = {
  phase:           'idle' | 'practice' | 'live' | 'complete';
  currentStimulus: DTStimulus | null;
  correct:         number;
  errors:          number;
  omissions:       number;
  delayed:         number;
  elapsedMs:       number;
  totalMs:         number;
  windowMs:        number;
  correctStreak:   number;
};

export type DTEngineControls = {
  state:  DTEngineState;
  start:  () => void;
  cancel: () => void;
};

─── IMPLEMENTATION ───────────────────────────────────────────────────────

export function useDTEngine(config: DTEngineConfig): DTEngineControls

Internal refs (never setState for these — they are mutable game state):
  rafHandle:         number | null
  prevTimestamp:     number | null
  elapsedRef:        number (milliseconds elapsed in current phase)
  showCountdown:     number (ms remaining in SHOW phase)
  isiCountdown:      number (ms remaining in ISI phase)
  inISI:             boolean
  stimulusOnsetTime: number | null  (performance.now() at stimulus display)
  lastStimulus:      DTStimulus | null
  rtList:            number[]  (reaction times for correct responses)
  perStimulus:       Record<DTStimulus, DTStimulusMetric>
  reverseKeyMap:     Record<string, DTStimulus>
  correctStreakRef:  number
  windowMsRef:       number
  activePool:        readonly DTStimulus[]

React state (only for what the component renders):
  DTEngineState (single useState for the whole object)

BUILD REVERSE KEY MAP (called inside start(), stored in ref):
  reverseKeyMap = {}
  for each [stimulus, key] in Object.entries(config.keyMap):
    reverseKeyMap[key] = stimulus as DTStimulus

INITIALISE perStimulus ref:
  for each stimulus in DT_STIMULI:
    perStimulus[stimulus] = { correct: 0, errors: 0, mean_rt_ms: 0 }

ACTIVE POOL: DT_TIER_STIMULI[config.tier]

WINDOW initialisation:
  action:   set windowMsRef = Infinity  (never expires in action mode)
  reaction: set windowMsRef = DT_TIMING.REACTION_WINDOW_MS
  adaptive: set windowMsRef = DT_TIMING.ADAPTIVE_START_MS

ISI per mode:
  action:   DT_TIMING.ACTION_ISI_MS
  reaction: DT_TIMING.REACTION_ISI_MS
  adaptive: DT_TIMING.ADAPTIVE_ISI_MS

RAF LOOP:
  Each frame receives a timestamp.
  delta = min(timestamp - prevTimestamp, 100)  // cap at 100ms (tab sleep guard)
  elapsedRef += delta
  prevTimestamp = timestamp

  If elapsedRef >= totalMs: call finishSession() and return.

  Two alternating phases controlled by inISI ref:

  SHOW phase (inISI === false):
    If currentStimulus is null: pick next stimulus (see STIMULUS SELECTION).
      Set stimulusOnsetTime = performance.now()
      Set showCountdown = windowMsRef (or a large value if Infinity)
    showCountdown -= delta
    If showCountdown <= 0 (window expired without correct response):
      Record omission: perStimulus[currentStimulus].errors unchanged,
        but increment omissions counter.
      Apply adaptive penalty.
      Transition to ISI: inISI = true, isiCountdown = ISI for this mode,
        currentStimulus = null, stimulusOnsetTime = null.

  ISI phase (inISI === true):
    isiCountdown -= delta
    If isiCountdown <= 0: inISI = false  (ready for next stimulus)

  At end of every frame: setState with snapshot of current values.

STIMULUS SELECTION:
  Pick random item from activePool.
  If activePool.length > 1 and chosen === lastStimulus: pick again once.
  Set lastStimulus = chosen.
  Return chosen.

KEYDOWN HANDLER (addEventListener on window, attached in start(), removed in stop):
  key = event.key.toLowerCase()
  pressedStimulus = reverseKeyMap[key]
  If pressedStimulus is undefined: return (not our key, ignore silently)

  Case A — inISI (currentStimulus is null):
    errors++
    correctStreakRef = 0
    applyAdaptivePenalty()

  Case B — pressedStimulus === currentStimulus AND showCountdown > 0:
    rt = performance.now() - (stimulusOnsetTime ?? performance.now())
    correct++
    rtList.push(rt)
    perStimulus[pressedStimulus].correct++
    applyAdaptiveReward()
    Transition immediately to ISI (don't wait for window to expire).

  Case C — pressedStimulus === currentStimulus AND showCountdown <= 0:
    delayed++  (correct stimulus, too late)

  Case D — pressedStimulus !== currentStimulus:
    errors++
    perStimulus[pressedStimulus].errors++
    correctStreakRef = 0
    applyAdaptivePenalty()

ADAPTIVE HELPERS (only execute when config.mode === 'adaptive'):

  applyAdaptiveReward():
    correctStreakRef++
    if correctStreakRef >= DT_TIMING.ADAPTIVE_STREAK_TARGET:
      windowMsRef = Math.max(
        DT_TIMING.ADAPTIVE_MIN_MS,
        windowMsRef - DT_TIMING.ADAPTIVE_FASTER_MS
      )
      correctStreakRef = 0

  applyAdaptivePenalty():
    correctStreakRef = 0
    windowMsRef = Math.min(
      DT_TIMING.ADAPTIVE_MAX_MS,
      windowMsRef + DT_TIMING.ADAPTIVE_SLOWER_MS
    )

finishSession():
  cancelAnimationFrame(rafHandle)
  window.removeEventListener('keydown', keydownHandler)

  Compute per_stimulus mean_rt_ms for each stimulus (if correct > 0).
  mean_rt_ms  = rtList.length > 0 ? rtList average : 0
  median_rt_ms = rtList.length > 0 ? rtList median  : 0

  const metrics: DTMetrics = {
    tier:             config.tier,
    mode:             config.mode,
    key_map_snapshot: config.keyMap,
    correct, delayed, errors, omissions,
    total_stimuli:    correct + delayed + errors + omissions,
    mean_rt_ms,
    median_rt_ms,
    final_window_ms:  config.mode === 'adaptive' ? windowMsRef : null,
    per_stimulus:     perStimulus (with per-stimulus mean_rt_ms computed),
  }

  setState({ phase: 'complete', ...other fields })
  config.onComplete(metrics)

cancel():
  Call finishSession() immediately.

useEffect cleanup: call finishSession() if phase is not 'idle' or 'complete'.

Zero 'any' types. No console.log. No direct DOM manipulation.
No fetch calls. This is pure game logic.
```

---

## Task 8 — Canvas Renderer

**Understanding gate — answer before running:**
`canvas.width = rect.width * dpr` sets the _pixel buffer_ size.
`ctx.scale(dpr, dpr)` scales the _drawing context_. Why do you
need BOTH, and what visual artefact appears if you only do one?

---

### Cursor prompt

```
Create the canvas rendering component for the Determination Test.

ONLY create this one file. Do not touch any other file.

Create: components/determination/DTCanvas.tsx

'use client'

import { useEffect, useRef } from 'react';
import {
  DT_STIMULUS_COLOUR,
  DT_TIER_NAMES,
  DT_TIER_STIMULI,
  type DTEngineState,
  type DTKeyMap,
  type DTMode,
  type DTTier,
} from '@/lib/determination/types';

// Note: DTEngineState is exported from lib/determination/useDTEngine.ts
// Import it from there, not from types.ts.

type DTCanvasProps = {
  engineState: DTEngineState;
  mode:        DTMode;
  tier:        DTTier;
  keyMap:      DTKeyMap;
};

export default function DTCanvas({ engineState, mode, tier, keyMap }: DTCanvasProps)

─── SETUP ───────────────────────────────────────────────────────────────

canvasRef = useRef<HTMLCanvasElement>(null)

ResizeObserver to handle window resize:
  On resize, re-apply DPR fix and redraw.

DPR fix (same pattern as VendingRing.tsx — apply whenever canvas size changes):
  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')!
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width  = rect.width  * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  // All subsequent drawing uses logical pixel values (rect.width, rect.height).

─── RENDER (useEffect, deps: [engineState, mode, tier, keyMap]) ─────────

Logical dimensions = rect.width, rect.height (after DPR setup).
cx = logicalWidth / 2
cy = logicalHeight / 2

1. BACKGROUND: ctx.fillStyle = '#000000', fill entire canvas.

2. STIMULUS CIRCLE (when engineState.currentStimulus is not null):
   if stimulus === 'tone':
     Draw ring only:
       ctx.beginPath()
       ctx.arc(cx, cy, 80, 0, Math.PI * 2)
       ctx.strokeStyle = '#FFFFFF'
       ctx.lineWidth = 6
       ctx.stroke()
   else:
     Draw filled circle:
       ctx.beginPath()
       ctx.arc(cx, cy, 80, 0, Math.PI * 2)
       ctx.fillStyle = DT_STIMULUS_COLOUR[stimulus]
       ctx.fill()

3. HUD (top-left):
   ctx.font = 'bold 18px Arial'
   ctx.fillStyle = '#FFFFFF'
   ctx.textBaseline = 'top'
   x = 24, y = 32, lineHeight = 28
   Line 1: `Mode: ${mode.toUpperCase()}`
   Line 2: `Tier ${tier} — ${DT_TIER_NAMES[tier]}`
   Line 3: remaining time as M:SS countdown
     remaining = Math.max(0, engineState.totalMs - engineState.elapsedMs)
     mins = Math.floor(remaining / 60000)
     secs = Math.floor((remaining % 60000) / 1000)
     `Time: ${mins}:${String(secs).padStart(2, '0')}`
   Line 4: `Correct: ${engineState.correct}   Errors: ${engineState.errors}`

4. PRACTICE LABEL (only when engineState.phase === 'practice'):
   ctx.font = '16px Arial'
   ctx.fillStyle = '#FACC15'
   ctx.textAlign = 'center'
   ctx.fillText('PRACTICE — responses not recorded', cx, 80)
   Reset ctx.textAlign = 'left' after.

5. KEY INDICATOR PANEL (practice and live phases only):
   Active stimuli = DT_TIER_STIMULI[tier]
   One pill per active stimulus.

   ctx.globalAlpha = engineState.phase === 'practice' ? 1.0 : 0.2

   Pill layout:
     dotRadius = 8
     padX = 12, padY = 8
     gap  = 12
     keyLabel = keyMap[stimulus] === ' ' ? 'SPC' : keyMap[stimulus].toUpperCase()
     ctx.font = 'bold 14px Arial'
     keyLabelWidth = ctx.measureText(keyLabel).width
     pillWidth  = dotRadius * 2 + 8 + keyLabelWidth + padX * 2
     pillHeight = dotRadius * 2 + padY * 2

   Total row width = sum of all pillWidths + gap * (count - 1)
   Row starts at x = cx - totalRowWidth / 2
   Row bottom edge = logicalHeight - 48

   For each pill:
     Draw rounded rectangle (use ctx.roundRect if available, else manual):
       fill '#1F2937', stroke '#374151', lineWidth 1
     Draw dot: filled circle, DT_STIMULUS_COLOUR[stimulus], radius dotRadius
     Draw key label: '#FFFFFF', positioned after the dot with 8px gap

   ctx.globalAlpha = 1.0  // reset after panel

─── JSX ──────────────────────────────────────────────────────────────────

return (
  <canvas
    ref={canvasRef}
    className="w-full h-full"
  />
)

The canvas itself has no fixed width/height attributes — size is controlled
by the container. The DPR fix sets the pixel buffer size dynamically.

Zero 'any' types. No requestAnimationFrame here.
This component is a pure renderer — it only reacts to prop changes.
```

---

## Task 9 — Pre-Session Screen

**Understanding gate — answer before running:**
The component fetches saved preferences in `useEffect` after mount.
This makes it a Client Component. Could it be a Server Component that
receives preferences as props from the page? What would break if it were?

---

### Cursor prompt

```
Create the pre-session screen for the Determination Test.

ONLY create this one file. Do not touch any other file.

Create: components/determination/DTPreSessionScreen.tsx

'use client'

import { useEffect, useState } from 'react';
import {
  DT_DEFAULT_KEY_MAP,
  DT_MODES,
  DT_MODE_DESCRIPTIONS,
  DT_STIMULUS_COLOUR,
  DT_TIER_DESCRIPTIONS,
  DT_TIER_NAMES,
  DT_TIER_STIMULI,
  DT_TIERS,
  type DTKeyMap,
  type DTMode,
  type DTTier,
} from '@/lib/determination/types';

type DTPreSessionScreenProps = {
  onStart:    (config: { tier: DTTier; mode: DTMode; keyMap: DTKeyMap }) => void;
  onEditKeys: () => void;
};

export default function DTPreSessionScreen({ onStart, onEditKeys }: DTPreSessionScreenProps)

─── STATE ───────────────────────────────────────────────────────────────
selectedTier: DTTier | null — starts null
selectedMode: DTMode | null — starts null
keyMap: DTKeyMap            — starts DT_DEFAULT_KEY_MAP
loadingPrefs: boolean       — starts true

─── ON MOUNT ────────────────────────────────────────────────────────────
fetch('/api/profile/preferences', { method: 'GET' })
If response contains preferences.dt_last_tier: set selectedTier
If response contains preferences.dt_last_mode: set selectedMode
If response contains preferences.dt_keys:
  setKeyMap({ ...DT_DEFAULT_KEY_MAP, ...preferences.dt_keys })
setLoadingPrefs(false) in finally block (runs on success and error).

─── UI (Tailwind, dark theme) ───────────────────────────────────────────

Outer wrapper: min-h-screen bg-background flex items-center justify-center p-8

Inner card: w-full max-w-2xl space-y-8

HEADING:
  <h1> "Determination Test" — text-3xl font-bold
  <p>  "Configure your session" — text-muted-foreground

SECTION 1 — TIER SELECTOR
  <h2> "Choose Tier"
  grid grid-cols-3 gap-4 (sm: grid-cols-1 on mobile via sm:grid-cols-3)
  For each tier in DT_TIERS (1, 2, 3):
    Card (clickable div) showing:
      - Tier number: text-5xl font-bold, coloured per tier
          1 = text-green-400, 2 = text-blue-400, 3 = text-purple-400
      - DT_TIER_NAMES[tier]
      - DT_TIER_DESCRIPTIONS[tier] in text-sm text-muted-foreground
      - Row of small colour dots for DT_TIER_STIMULI[tier]
          Each dot: 8px × 8px circle, inline-block, coloured via
          style={{ backgroundColor: DT_STIMULUS_COLOUR[stim] }}
    Selected: border-white bg-accent
    Unselected: border-border bg-card hover:bg-accent/50
    onClick: setSelectedTier(tier)

SECTION 2 — MODE SELECTOR
  <h2> "Choose Mode"
  flex gap-3 (flex-wrap on mobile)
  For each mode in DT_MODES:
    Button (flex-col items-center p-4):
      Mode name capitalised
      DT_MODE_DESCRIPTIONS[mode] in text-xs opacity-70
    Selected: variant="default" (solid)
    Unselected: variant="outline"
    onClick: setSelectedMode(mode)

SECTION 3 — KEY LAYOUT (only shown when selectedTier is not null)
  <h2> "Key Assignments"
  If loadingPrefs: show 3 skeleton rows (use shadcn Skeleton or plain
    divs with animate-pulse)
  Else: table showing active stimuli for selectedTier
    Columns: Colour | Stimulus | Limb | Key
    Use DT_STIMULUS_COLOUR, DT_STIMULUS_LIMB, keyMap from @/lib/determination/types
    Key display: monospace, space shows as "Space"
  Below table: "Edit Keys" button, variant="outline", size="sm"
    onClick: onEditKeys()

SECTION 4 — START BUTTON
  Full width. variant="default". size="lg"
  Text: "Start Session"
  disabled when selectedTier === null OR selectedMode === null
  onClick: onStart({ tier: selectedTier!, mode: selectedMode!, keyMap })

Use shadcn/ui Button, Skeleton. Zero 'any' types.
```

---

## Task 10 — Key Remapping Modal

**Understanding gate — answer before running:**
Conflict detection checks all 7 stimuli even when only Tier 1 (2 stimuli)
is active. Why does checking only the 2 active stimuli create a
specific bug when the user later switches to Tier 2 or 3?

---

### Cursor prompt

```
Create the key remapping modal for the Determination Test.

ONLY create this one file. Do not touch any other file.

Create: components/determination/DTKeyRemapModal.tsx

'use client'

import { useEffect, useRef, useState } from 'react';
import {
  DT_DEFAULT_KEY_MAP,
  DT_RESERVED_KEYS,
  DT_STIMULI,
  DT_STIMULUS_COLOUR,
  DT_STIMULUS_LIMB,
  DT_TIER_STIMULI,
  type DTKeyMap,
  type DTStimulus,
  type DTTier,
} from '@/lib/determination/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DTKeyRemapModalProps = {
  open:        boolean;
  activeTier:  DTTier;
  keyMap:      DTKeyMap;
  onSave:      (newKeyMap: DTKeyMap) => void;
  onClose:     () => void;
};

export default function DTKeyRemapModal({
  open, activeTier, keyMap, onSave, onClose,
}: DTKeyRemapModalProps)

─── STATE ───────────────────────────────────────────────────────────────
localMap: DTKeyMap  — copy of keyMap (re-initialise from prop when open changes)
listening: DTStimulus | null — which row is awaiting a keypress
rowErrors: Record<DTStimulus, string | null> — per-row error messages
preListenKey: useRef<string>  — key value before entering listening state

useEffect([open]): when open becomes true, reset localMap to keyMap,
  clear all errors, set listening = null.

─── KEYDOWN LISTENER ────────────────────────────────────────────────────
useEffect([open, listening]): attach when open && listening !== null.
Remove in cleanup.

On keydown (only when listening !== null):
  event.preventDefault()
  key = event.key.toLowerCase()

  // Rule 1: Escape cancels, reverts to previous key
  if (key === 'escape') {
    localMap[listening] = preListenKey.current
    rowErrors[listening] = null
    listening = null
    return
  }

  // Rule 2: Reserved keys
  if (DT_RESERVED_KEYS.has(key)) {
    rowErrors[listening] = 'Key not allowed'
    return
  }

  // Rule 3: Conflict — check ALL 7 stimuli
  const conflict = DT_STIMULI.find(
    (s) => s !== listening && localMap[s] === key
  )
  if (conflict) {
    rowErrors[listening] = `Already assigned to ${conflict}`
    return
  }

  // Rule 4: Valid assignment
  localMap[listening] = key
  rowErrors[listening] = null
  listening = null

─── UI ──────────────────────────────────────────────────────────────────
<Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Edit Key Assignments</DialogTitle>
    </DialogHeader>

    <div className="space-y-2">
      For each stimulus in DT_STIMULI (all 7, always shown):
        const isActive = DT_TIER_STIMULI[activeTier].includes(stimulus)

        Row (flex items-center gap-3):
          Colour dot: 12×12 circle, DT_STIMULUS_COLOUR[stimulus]
          Stimulus name: w-20 text-sm (capitalise)
          Limb label: flex-1 text-xs text-muted-foreground
            DT_STIMULUS_LIMB[stimulus]
          Key field:

          If NOT isActive:
            <span className="opacity-40 text-xs">🔒</span>
            title="Not active in this tier"

          If isActive AND listening === stimulus:
            <button
              className="w-16 text-center font-mono text-sm border-2
                         border-blue-500 rounded px-2 py-1 animate-pulse"
            >
              …
            </button>

          If isActive AND listening !== stimulus:
            <button
              className="w-16 text-center font-mono text-sm border
                         rounded px-2 py-1 hover:border-blue-400"
              onClick={() => {
                preListenKey.current = localMap[stimulus]
                setListening(stimulus)
                clearError(stimulus)
              }}
            >
              {localMap[stimulus] === ' ' ? 'Space' : localMap[stimulus].toUpperCase()}
            </button>

          If rowErrors[stimulus]: show error in red text-xs below the row.

        If NOT isActive: row opacity-40 pointer-events-none
    </div>

    <DialogFooter className="flex justify-between">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setLocalMap({ ...DT_DEFAULT_KEY_MAP })
          clearAllErrors()
          setListening(null)
        }}
      >
        Reset to defaults
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={listening !== null}
          onClick={() => { onSave(localMap); onClose(); }}
        >
          Save
        </Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>

Zero 'any' types. No animation library.
```

---

## Task 11 — Session Summary

**Understanding gate — answer before running:**
The summary highlights the stimulus row with the highest error count.
If every stimulus has 0 errors (a perfect session), no row is
highlighted. Why is this correct behaviour rather than highlighting
the row with the slowest reaction time?

---

### Cursor prompt

```
Create the session summary component for the Determination Test.

ONLY create this one file. Do not touch any other file.

Create: components/determination/DTSessionSummary.tsx

'use client'

import {
  DT_STIMULUS_COLOUR,
  DT_TIER_NAMES,
  DT_TIER_STIMULI,
  type DTMetrics,
  type DTStimulus,
} from '@/lib/determination/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DTSessionSummaryProps = {
  metrics:   DTMetrics;
  onSave:    () => void;
  onDiscard: () => void;
  saving:    boolean;
};

export default function DTSessionSummary({
  metrics, onSave, onDiscard, saving,
}: DTSessionSummaryProps)

─── UI (Tailwind, dark theme) ───────────────────────────────────────────

Outer: min-h-screen bg-background p-8
Inner: max-w-2xl mx-auto space-y-6

HEADER:
  <h1> "Session Complete" — text-3xl font-bold
  <p>  `${DT_TIER_NAMES[metrics.tier]} — ${
         metrics.mode.charAt(0).toUpperCase() + metrics.mode.slice(1)
       } Mode`

STATS CARDS (grid grid-cols-2 gap-4 md:grid-cols-4):
  1. "Correct"  — metrics.correct
  2. "Errors"   — metrics.errors
  3. "Accuracy" — computed:
       total = metrics.correct + metrics.errors + metrics.omissions
       pct   = total === 0 ? 0 : (metrics.correct / total * 100)
       display: pct.toFixed(1) + '%'
  4. "Avg RT"   — metrics.mean_rt_ms === 0
       ? '— ms'
       : metrics.mean_rt_ms.toFixed(0) + ' ms'

PER-STIMULUS TABLE:
  <h2> "Breakdown by Stimulus"
  Active stimuli = DT_TIER_STIMULI[metrics.tier]

  Find worstStimulus:
    const worstStimulus = active.reduce<DTStimulus | null>((worst, s) => {
      if (worst === null) return metrics.per_stimulus[s].errors > 0 ? s : null;
      return metrics.per_stimulus[s].errors > metrics.per_stimulus[worst].errors
        ? s : worst;
    }, null);

  Table columns: Stimulus | Correct | Errors | Avg RT (ms)
  For each active stimulus:
    First cell: flex row — colour dot (8×8 circle) + stimulus name capitalised
    Highlight row if stimulus === worstStimulus:
      className="bg-amber-950/50"

ADAPTIVE DETAIL (only when metrics.mode === 'adaptive'):
  <p> `Final window: ${metrics.final_window_ms} ms`
  <p className="text-xs text-muted-foreground">
    "Lower is better — the algorithm compressed your window to this pace."
  </p>

BUTTONS (flex justify-between):
  Left:  <Button variant="outline" onClick={onDiscard} disabled={saving}>
           Discard
         </Button>
  Right: <Button onClick={onSave} disabled={saving}>
           {saving ? (
             <><span className="animate-spin mr-2">⟳</span>Saving…</>
           ) : 'Save & Finish'}
         </Button>

Zero 'any' types. Use shadcn Card and Button.
```

---

## Task 12 — Page Route

**Understanding gate — answer before running:**
The session row is created when the user clicks "Start Session", not
when the page loads. Describe a concrete data quality problem that
would exist in the database if you created the row on page load instead.

---

### Cursor prompt

```
Create the page route for the Determination Test module.

ONLY create this one file. Do not touch any other file.

Create: app/(app)/train/determination/page.tsx

'use client'

─── IMPORTS ──────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useDTEngine,
  type DTEngineControls,
} from '@/lib/determination/useDTEngine';
import DTCanvas from '@/components/determination/DTCanvas';
import DTPreSessionScreen from '@/components/determination/DTPreSessionScreen';
import DTSessionSummary from '@/components/determination/DTSessionSummary';
import DTKeyRemapModal from '@/components/determination/DTKeyRemapModal';
import {
  DT_DEFAULT_KEY_MAP,
  type DTKeyMap,
  type DTMetrics,
  type DTMode,
  type DTTier,
} from '@/lib/determination/types';
import { createClient } from '@/lib/supabase/client';

─── STATE ────────────────────────────────────────────────────────────────

type PagePhase = 'preSession' | 'practice' | 'live' | 'summary' | 'saving';

pagePhase:   PagePhase  — 'preSession'
tier:        DTTier | null — null
mode:        DTMode | null — null
keyMap:      DTKeyMap  — DT_DEFAULT_KEY_MAP
sessionId:   string | null — null
metrics:     DTMetrics | null — null
remapOpen:   boolean — false
showEscHint: boolean — false
startError:  string | null — null

// Safe fallbacks so hooks always receive valid props:
const safeTier = tier ?? 1
const safeMode = mode ?? 'action'

─── ENGINE INSTANCES ─────────────────────────────────────────────────────

// Both engines are always mounted — hooks cannot be conditional.
const practiceEngine = useDTEngine({
  tier: safeTier, mode: safeMode, keyMap,
  isPractice: true,
  onComplete: handlePracticeComplete,
});

const liveEngine = useDTEngine({
  tier: safeTier, mode: safeMode, keyMap,
  isPractice: false,
  onComplete: handleLiveComplete,
});

─── HANDLERS ────────────────────────────────────────────────────────────

handleStart(config: { tier: DTTier; mode: DTMode; keyMap: DTKeyMap }):
  setStartError(null)
  setTier(config.tier), setMode(config.mode), setKeyMap(config.keyMap)

  // Create session row — POST sends { module: 'determination' }
  const supabase = createClient()
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'determination' }),
  })
  if (!res.ok) {
    setStartError('Could not start session. Please try again.')
    return
  }
  const { id } = await res.json() as { id: string }
  setSessionId(id)
  setShowEscHint(true)
  setPagePhase('practice')
  practiceEngine.start()

handlePracticeComplete():
  setPagePhase('live')
  liveEngine.start()

handleLiveComplete(result: DTMetrics):
  setMetrics(result)
  setPagePhase('summary')

handleSave():
  if (!sessionId || !metrics) return
  setPagePhase('saving')
  const total = metrics.correct + metrics.errors + metrics.omissions
  const accuracy = total === 0 ? 0 : metrics.correct / total * 100
  await fetch(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completed_at: new Date().toISOString(),
      duration_s:   Math.round(metrics.mean_rt_ms * metrics.total_stimuli / 1000),
      score:        metrics.correct,
      accuracy:     parseFloat(accuracy.toFixed(2)),
      metrics,
    }),
  })
  // On error: set pagePhase back to 'summary', set startError.
  // On success: router.push('/dashboard')

handleDiscard(): router.push('/dashboard')

handleCancel():
  if (pagePhase === 'practice') practiceEngine.cancel()
  if (pagePhase === 'live')     liveEngine.cancel()
  setPagePhase('preSession')
  setSessionId(null)

handleKeyMapSave(newMap: DTKeyMap):
  setKeyMap(newMap)
  setRemapOpen(false)
  // Fire-and-forget — do not block UI:
  fetch('/api/profile/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences: { dt_keys: newMap } }),
  }).catch(() => {})

─── ESC KEY HANDLER ─────────────────────────────────────────────────────

useEffect: listen for keydown on window when pagePhase is 'practice' or 'live'.
  if (e.key === 'Escape') { e.preventDefault(); handleCancel() }
Cleanup: removeEventListener.

─── ESC HINT FADE ────────────────────────────────────────────────────────

useEffect([pagePhase]): when pagePhase becomes 'practice':
  setShowEscHint(true)
  const t = setTimeout(() => setShowEscHint(false), 3000)
  return () => clearTimeout(t)

─── RENDER ──────────────────────────────────────────────────────────────

// IMPORTANT: Do NOT render TopNav manually — it is injected by
// app/(app)/layout.tsx for all non-game phases automatically.
// Do NOT add an auth guard — app/(app)/layout.tsx handles it.

if (pagePhase === 'preSession'):
  return (
    <>
      {startError && <p className="text-red-500 text-center">{startError}</p>}
      <DTPreSessionScreen
        onStart={handleStart}
        onEditKeys={() => setRemapOpen(true)}
      />
      <DTKeyRemapModal
        open={remapOpen}
        activeTier={safeTier}
        keyMap={keyMap}
        onSave={handleKeyMapSave}
        onClose={() => setRemapOpen(false)}
      />
    </>
  )

if (pagePhase === 'practice' or 'live'):
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <DTCanvas
        engineState={
          pagePhase === 'practice' ? practiceEngine.state : liveEngine.state
        }
        mode={safeMode}
        tier={safeTier}
        keyMap={keyMap}
      />
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2
        text-xs text-white/40 select-none transition-opacity duration-1000
        ${showEscHint ? 'opacity-100' : 'opacity-0'}`}
      >
        Press Esc to cancel session
      </div>
    </div>
  )

if (pagePhase === 'summary' or 'saving'):
  return metrics ? (
    <DTSessionSummary
      metrics={metrics}
      onSave={handleSave}
      onDiscard={handleDiscard}
      saving={pagePhase === 'saving'}
    />
  ) : null

Zero 'any' types. Match the code style of app/(app)/train/vigilance/page.tsx.
```

---

## Task 13 — Navigation Link

**Understanding gate — answer before running:**
`app/(app)/train/page.tsx` is a Server Component (no `'use client'`).
What would break if you accidentally added `'use client'` to it when
inserting the new card?

---

### Cursor prompt

```
Add the Determination Test to the training module selection page.

ONLY modify this one file. Do not touch any other file.

File: app/(app)/train/page.tsx

The file currently has one Link block for Vigilance.
Add a second Link block immediately after it, inside the same grid div:

<Link
  href="/train/determination"
  className="block border rounded-xl p-6 hover:bg-accent transition-colors"
>
  <h2 className="text-xl font-semibold">Determination Test</h2>
  <p className="text-sm text-muted-foreground mt-1">
    Multi-limb reaction · Adaptive pacing · Full aviation battery
  </p>
</Link>

Do not add 'use client'. Do not change the Vigilance link.
Do not change the heading, layout, or any other part of the file.
Make the smallest possible change.
```

---

## Task 14 — Vitest Unit Tests

**Understanding gate — answer before running:**
These tests verify pure logic by calling the adaptive algorithm
directly, without mounting React hooks or a browser. Why can't
you just call `useDTEngine()` directly in a test file without
`renderHook` from `@testing-library/react`?

---

### Cursor prompt

```
Write unit tests for the DT adaptive window logic.

ONLY create this one file. Do not touch any other file.

Create: lib/__tests__/useDTEngine.test.ts

Use Vitest (already configured — see lib/__tests__/session.test.ts for
import pattern and style).

These tests verify the PURE ADAPTIVE ALGORITHM LOGIC in isolation.
They do NOT mount React hooks, do NOT use renderHook, do NOT touch DOM.
They test the logic by simulating it as plain functions.

import { describe, it, expect } from 'vitest';
import { DT_TIMING } from '@/lib/determination/types';

// Helper — simulates one "correct" event on the adaptive window state
function applyReward(
  windowMs: number,
  streak: number,
): { windowMs: number; streak: number } {
  streak++;
  if (streak >= DT_TIMING.ADAPTIVE_STREAK_TARGET) {
    windowMs = Math.max(
      DT_TIMING.ADAPTIVE_MIN_MS,
      windowMs - DT_TIMING.ADAPTIVE_FASTER_MS,
    );
    streak = 0;
  }
  return { windowMs, streak };
}

// Helper — simulates one error/omission event
function applyPenalty(windowMs: number): { windowMs: number; streak: number } {
  return {
    windowMs: Math.min(
      DT_TIMING.ADAPTIVE_MAX_MS,
      windowMs + DT_TIMING.ADAPTIVE_SLOWER_MS,
    ),
    streak: 0,
  };
}

describe('DT adaptive window logic', () => {
  it('decreases window after a correct streak of 3', () => {
    let state = { windowMs: DT_TIMING.ADAPTIVE_START_MS, streak: 0 };
    state = applyReward(state.windowMs, state.streak);
    state = applyReward(state.windowMs, state.streak);
    state = applyReward(state.windowMs, state.streak);
    expect(state.windowMs).toBe(
      DT_TIMING.ADAPTIVE_START_MS - DT_TIMING.ADAPTIVE_FASTER_MS,
    );
    expect(state.streak).toBe(0);
  });

  it('does not decrease window before streak reaches 3', () => {
    let state = { windowMs: DT_TIMING.ADAPTIVE_START_MS, streak: 0 };
    state = applyReward(state.windowMs, state.streak);
    state = applyReward(state.windowMs, state.streak);
    expect(state.windowMs).toBe(DT_TIMING.ADAPTIVE_START_MS);
    expect(state.streak).toBe(2);
  });

  it('increases window and resets streak after an error', () => {
    let state = { windowMs: DT_TIMING.ADAPTIVE_START_MS, streak: 2 };
    state = applyPenalty(state.windowMs);
    expect(state.windowMs).toBe(
      DT_TIMING.ADAPTIVE_START_MS + DT_TIMING.ADAPTIVE_SLOWER_MS,
    );
    expect(state.streak).toBe(0);
  });

  it('never decreases window below the minimum', () => {
    const state = applyReward(DT_TIMING.ADAPTIVE_MIN_MS, DT_TIMING.ADAPTIVE_STREAK_TARGET - 1);
    expect(state.windowMs).toBe(DT_TIMING.ADAPTIVE_MIN_MS);
  });

  it('never increases window above the maximum', () => {
    const state = applyPenalty(DT_TIMING.ADAPTIVE_MAX_MS);
    expect(state.windowMs).toBe(DT_TIMING.ADAPTIVE_MAX_MS);
  });
});
```

---

## Final checklist — run before committing

```bash
npm run lint           # zero errors
npm run build          # zero type errors, clean build
npm run test           # all tests pass (existing + new)
```

Then verify live at train.aljundi.me:

- `/train` page shows both Vigilance and Determination Test cards
- `/train/determination` pre-session screen loads correctly
- Session row appears in Supabase after clicking Start
- Practice phase (30 s) does not write score
- Live session scores correctly, Escape cancels cleanly
- Save & Finish PATCHes session and redirects to dashboard
- Remapped keys work during play

---

## Task order summary

| #   | File                                                                 | Key issue this task addresses                   |
| --- | -------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | `lib/determination/types.ts`                                         | All shared types — foundation for everything    |
| 2   | `supabase/migrations/20260425000000_add_preferences_to_profiles.sql` | DB column for key preferences                   |
| 3   | `lib/schemas/session.ts` (append)                                    | DT schema separate from strict Vigilance schema |
| 4   | `app/api/sessions/route.ts` (modify)                                 | POST must accept `module: 'determination'`      |
| 5   | `app/api/sessions/[id]/route.ts` (modify)                            | PATCH must accept DT metrics shape              |
| 6   | `app/api/profile/preferences/route.ts`                               | Persist key remapping server-side               |
| 7   | `lib/determination/useDTEngine.ts`                                   | Core game loop                                  |
| 8   | `components/determination/DTCanvas.tsx`                              | Pure canvas renderer                            |
| 9   | `components/determination/DTPreSessionScreen.tsx`                    | Tier + mode selection UI                        |
| 10  | `components/determination/DTKeyRemapModal.tsx`                       | Key remapping UI                                |
| 11  | `components/determination/DTSessionSummary.tsx`                      | Results screen                                  |
| 12  | `app/(app)/train/determination/page.tsx`                             | Wires everything together                       |
| 13  | `app/(app)/train/page.tsx` (modify)                                  | Adds DT to navigation                           |
| 14  | `lib/__tests__/useDTEngine.test.ts`                                  | Verifies adaptive algorithm                     |
