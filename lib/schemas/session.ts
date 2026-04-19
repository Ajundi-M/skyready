import { z } from 'zod';

/**
 * Validates the JSON metrics object stored with each vigilance session.
 * Keys use snake_case to match the Postgres jsonb column conventions.
 */
export const sessionMetricsSchema = z
  .object({
    skips_encountered: z.number().int().min(0),
    skips_detected: z.number().int().min(0),
    false_presses: z.number().int().min(0),
    move_interval_ms: z.number().int().min(100).max(5000),
    circle_count: z.number().int().min(1).max(200),
    /** True when the session was abandoned by navigating away mid-game. */
    cancelled: z.boolean().optional(),
  })
  .strict();

/**
 * Validates the request body for PATCH /api/sessions/[id].
 *
 * Score bounds are capped at ±2× the session duration in seconds; a player
 * who detects every skip (one per ~500 ms) earns at most 2 points per second,
 * and the maximum penalty is symmetric.
 */
export const patchSessionSchema = z
  .object({
    completed_at: z.string().datetime().optional(),
    duration_s: z.number().int().min(0).max(3600),
    score: z.number().int(),
    accuracy: z.number().min(0).max(100),
    metrics: sessionMetricsSchema,
  })
  .strict()
  .refine((d) => d.score >= -d.duration_s * 2 && d.score <= d.duration_s * 2, {
    message: 'score is outside plausible range for this session duration',
    path: ['score'],
  });

export type SessionMetrics = z.infer<typeof sessionMetricsSchema>;
export type PatchSessionBody = z.infer<typeof patchSessionSchema>;
