// ── Stimulus names ──────────────────────────────────────────────
export const DT_STIMULI = [
  'red',
  'blue',
  'yellow',
  'green',
  'foot_left',
  'foot_right',
  'tone_left',
  'tone_right',
] as const;
export type DTStimulus = (typeof DT_STIMULI)[number];

// ── Test variants ────────────────────────────────────────────────
// visual    = 6 stimuli: 4 colour circles + 2 foot keys
// visual_oral = 8 stimuli: above + tone_left + tone_right (headphones required)
export const DT_VARIANTS = ['visual', 'visual_oral'] as const;
export type DTVariant = (typeof DT_VARIANTS)[number];

// ── Active stimuli per variant ───────────────────────────────────
export const DT_VARIANT_STIMULI: Record<DTVariant, readonly DTStimulus[]> = {
  visual: ['red', 'blue', 'yellow', 'green', 'foot_left', 'foot_right'],
  visual_oral: [
    'red',
    'blue',
    'yellow',
    'green',
    'foot_left',
    'foot_right',
    'tone_left',
    'tone_right',
  ],
};

// ── Variant display names ────────────────────────────────────────
export const DT_VARIANT_NAMES: Record<DTVariant, string> = {
  visual: 'Visual Only',
  visual_oral: 'Visual + Oral',
};

// ── Variant stimulus counts ──────────────────────────────────────
export const DT_VARIANT_COUNTS: Record<DTVariant, string> = {
  visual: '6 stimuli',
  visual_oral: '8 stimuli',
};

// ── Presentation modes ──────────────────────────────────────────
export const DT_MODES = ['action', 'reaction', 'adaptive'] as const;
export type DTMode = (typeof DT_MODES)[number];

// ── Mode display names ───────────────────────────────────────────
export const DT_MODE_NAMES: Record<DTMode, string> = {
  action: 'Action',
  reaction: 'Reaction',
  adaptive: 'Adaptive',
};

// ── Mode user-facing descriptions ───────────────────────────────
export const DT_MODE_DESCRIPTIONS: Record<DTMode, string> = {
  action:
    'No time limit — the stimulus waits for your response. Focus on hitting the right key.',
  reaction: 'You have 0.8 seconds to respond. Fixed pace throughout.',
  adaptive:
    'Starts slow and speeds up as you improve. This is the real selection standard.',
};

// ── Mode extended explanations (shown in Learn More accordion) ───
export const DT_MODE_DETAILS: Record<
  DTMode,
  {
    bestFor: string;
    measures: string;
    pressure: string;
    duration: string;
  }
> = {
  action: {
    bestFor: 'First-timers learning key positions',
    measures: 'Accuracy only',
    pressure: 'None — stimulus waits for you indefinitely',
    duration: '5 minutes',
  },
  reaction: {
    bestFor: 'Building speed after learning the keys',
    measures: 'Speed and accuracy under constant pressure',
    pressure: 'Fixed 800 ms window — same pace regardless of your performance',
    duration: '5 minutes',
  },
  adaptive: {
    bestFor: 'Realistic pilot selection preparation',
    measures: 'Your personal performance ceiling',
    pressure: 'Dynamic — 3 correct in a row speeds up, any error slows down',
    duration: '8 minutes',
  },
};

// ── Stimulus hex colours ────────────────────────────────────────
export const DT_STIMULUS_COLOUR: Record<DTStimulus, string> = {
  red: '#DC2626',
  blue: '#2563EB',
  yellow: '#D97706',
  green: '#16A34A',
  foot_left: '#6B7280',
  foot_right: '#6B7280',
  tone_left: '#A855F7',
  tone_right: '#EC4899',
};

// ── Stimulus limb labels ────────────────────────────────────────
export const DT_STIMULUS_LIMB: Record<DTStimulus, string> = {
  red: 'Left hand',
  blue: 'Left hand',
  yellow: 'Right hand',
  green: 'Right hand',
  foot_left: 'Left foot',
  foot_right: 'Right foot',
  tone_left: 'Left ear',
  tone_right: 'Right ear',
};

// ── Stimulus input type ─────────────────────────────────────────
// Used by the engine to decide whether to play audio
export const DT_STIMULUS_IS_AUDIO: Record<DTStimulus, boolean> = {
  red: false,
  blue: false,
  yellow: false,
  green: false,
  foot_left: false,
  foot_right: false,
  tone_left: true,
  tone_right: true,
};

// ── Audio pan per tone stimulus (-1 = full left, +1 = full right) ─
export const DT_TONE_PAN: Partial<Record<DTStimulus, number>> = {
  tone_left: -1,
  tone_right: 1,
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
  tone_left: ' ',
  tone_right: 'enter',
};

// ── Reserved keys that can never be remapped ────────────────────
export const DT_RESERVED_KEYS = new Set([
  'escape',
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

// ── Metric shapes ───────────────────────────────────────────────
export type DTStimulusMetric = {
  correct: number;
  errors: number;
  mean_rt_ms: number;
};

export type DTMetrics = {
  variant: DTVariant;
  mode: DTMode;
  key_map_snapshot: DTKeyMap;
  correct: number;
  delayed: number;
  errors: number;
  omissions: number;
  total_stimuli: number;
  mean_rt_ms: number;
  median_rt_ms: number;
  final_window_ms: number | null;
  per_stimulus: Record<DTStimulus, DTStimulusMetric>;
};

// ── User preferences shape ──────────────────────────────────────
export type DTPreferences = {
  dt_keys?: DTKeyMap;
  dt_last_variant?: DTVariant;
  dt_last_mode?: DTMode;
};
