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
  red: '#DC2626',
  blue: '#2563EB',
  yellow: '#D97706',
  green: '#16A34A',
  foot_left: '#6B7280',
  foot_right: '#6B7280',
  tone: '#FFFFFF',
};

// ── Stimulus limb labels ────────────────────────────────────────
export const DT_STIMULUS_LIMB: Record<DTStimulus, string> = {
  red: 'Left hand',
  blue: 'Left hand',
  yellow: 'Right hand',
  green: 'Right hand',
  foot_left: 'Left foot',
  foot_right: 'Right foot',
  tone: 'Either hand',
};

// ── Key map ─────────────────────────────────────────────────────
// Values are lowercase single characters from event.key.toLowerCase().
// Space bar is stored as a single space ' '.
export type DTKeyMap = Record<DTStimulus, string>;

export const DT_DEFAULT_KEY_MAP: DTKeyMap = {
  red: 's',
  blue: 'a',
  yellow: 'l',
  green: 'k',
  foot_left: 'z',
  foot_right: '/',
  tone: ' ',
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
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
  'f10',
  'f11',
  'f12',
]);

// ── Timing constants (milliseconds) ────────────────────────────
export const DT_TIMING = {
  ACTION_ISI_MS: 300,
  REACTION_WINDOW_MS: 800,
  REACTION_ISI_MS: 400,
  ADAPTIVE_START_MS: 1200,
  ADAPTIVE_MIN_MS: 400,
  ADAPTIVE_MAX_MS: 2000,
  ADAPTIVE_FASTER_MS: 50,
  ADAPTIVE_SLOWER_MS: 100,
  ADAPTIVE_STREAK_TARGET: 3,
  ADAPTIVE_ISI_MS: 300,
  PRACTICE_DURATION_MS: 30_000,
} as const;

// ── Session durations per mode ──────────────────────────────────
export const DT_SESSION_DURATION_MS: Record<DTMode, number> = {
  action: 5 * 60 * 1000,
  reaction: 5 * 60 * 1000,
  adaptive: 8 * 60 * 1000,
};

// ── Mode descriptions ───────────────────────────────────────────
export const DT_MODE_DESCRIPTIONS: Record<DTMode, string> = {
  action: 'Unlimited window · accuracy focus',
  reaction: '800 ms window · fixed pace',
  adaptive: 'Dynamic pace · selection standard',
};

// ── Metric shapes ───────────────────────────────────────────────
export type DTStimulusMetric = {
  correct: number;
  errors: number;
  mean_rt_ms: number;
};

export type DTMetrics = {
  tier: DTTier;
  mode: DTMode;
  key_map_snapshot: DTKeyMap;
  correct: number;
  delayed: number;
  errors: number;
  omissions: number;
  total_stimuli: number;
  mean_rt_ms: number;
  median_rt_ms: number;
  final_window_ms: number | null; // null unless adaptive
  per_stimulus: Record<DTStimulus, DTStimulusMetric>;
};

// ── User preferences shape (stored in profiles.preferences JSONB) ──
export type DTPreferences = {
  dt_keys?: DTKeyMap;
  dt_last_tier?: DTTier;
  dt_last_mode?: DTMode;
};
