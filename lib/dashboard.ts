export type ModuleColumn =
  | 'date'
  | 'duration'
  | 'score'
  | 'accuracy'
  | 'skips_detected'
  | 'false_presses'
  | 'correct'
  | 'errors'
  | 'omissions'
  | 'mean_rt_ms';

export type ModuleConfig = {
  label: string;
  accent: string;
  primaryChart: 'accuracy' | 'score' | 'correct';
  secondaryChart: 'score' | 'accuracy' | 'mean_rt_ms' | 'correct';
  columns: ModuleColumn[];
};

export const MODULE_REGISTRY = {
  vigilance: {
    label: 'Vigilance',
    accent: '#3b82f6',
    primaryChart: 'accuracy',
    secondaryChart: 'score',
    columns: [
      'date',
      'duration',
      'score',
      'accuracy',
      'skips_detected',
      'false_presses',
    ],
  },
  determination: {
    label: 'Determination',
    accent: '#f59e0b',
    primaryChart: 'accuracy',
    secondaryChart: 'mean_rt_ms',
    columns: [
      'date',
      'duration',
      'accuracy',
      'correct',
      'errors',
      'omissions',
      'mean_rt_ms',
    ],
  },
} as const satisfies Record<string, ModuleConfig>;

export type ModuleId = keyof typeof MODULE_REGISTRY;

export type SessionRow = {
  id: string;
  module: string;
  completed_at: string;
  duration_s: number | null;
  score: number | null;
  accuracy: number | null;
  metrics: Record<string, number | string | null> | null;
};

export type ModuleData = {
  id: ModuleId;
  config: ModuleConfig;
  sessions: SessionRow[];
  bestScore: number | null;
  bestAccuracy: number | null;
  avgAccuracy: number | null;
};
