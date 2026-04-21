import { describe, it, expect } from 'vitest';
import { patchSessionSchema, sessionMetricsSchema } from '../schemas/session';

const validMetrics = {
  skips_encountered: 10,
  skips_detected: 8,
  false_presses: 2,
  move_interval_ms: 500,
  circle_count: 50,
};

const validPayload = {
  completed_at: '2026-04-19T10:30:00.000Z',
  duration_s: 300,
  score: 6,
  accuracy: 80,
  metrics: validMetrics,
};

// ─── sessionMetricsSchema ────────────────────────────────────────────────────

describe('sessionMetricsSchema', () => {
  it('accepts a valid metrics object', () => {
    expect(sessionMetricsSchema.safeParse(validMetrics).success).toBe(true);
  });

  it('accepts metrics with the optional cancelled flag', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, cancelled: true })
        .success,
    ).toBe(true);
  });

  it('rejects unknown keys (strict mode)', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, extra: 'value' })
        .success,
    ).toBe(false);
  });

  it('rejects negative counts', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, skips_encountered: -1 })
        .success,
    ).toBe(false);
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, false_presses: -1 })
        .success,
    ).toBe(false);
  });

  it('rejects non-integer counts', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, skips_detected: 1.5 })
        .success,
    ).toBe(false);
  });

  it('rejects move_interval_ms below minimum (100 ms)', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, move_interval_ms: 99 })
        .success,
    ).toBe(false);
  });

  it('rejects move_interval_ms above maximum (5000 ms)', () => {
    expect(
      sessionMetricsSchema.safeParse({
        ...validMetrics,
        move_interval_ms: 5001,
      }).success,
    ).toBe(false);
  });

  it('accepts move_interval_ms at boundary values 100 and 5000', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, move_interval_ms: 100 })
        .success,
    ).toBe(true);
    expect(
      sessionMetricsSchema.safeParse({
        ...validMetrics,
        move_interval_ms: 5000,
      }).success,
    ).toBe(true);
  });

  it('rejects circle_count of 0', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, circle_count: 0 })
        .success,
    ).toBe(false);
  });

  it('rejects circle_count above 200', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, circle_count: 201 })
        .success,
    ).toBe(false);
  });

  it('accepts circle_count at boundary values 1 and 200', () => {
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, circle_count: 1 })
        .success,
    ).toBe(true);
    expect(
      sessionMetricsSchema.safeParse({ ...validMetrics, circle_count: 200 })
        .success,
    ).toBe(true);
  });
});

// ─── patchSessionSchema ──────────────────────────────────────────────────────

describe('patchSessionSchema', () => {
  it('accepts a fully valid payload', () => {
    expect(patchSessionSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts payload without the optional completed_at', () => {
    const { completed_at: _omit, ...withoutDate } = validPayload;
    expect(patchSessionSchema.safeParse(withoutDate).success).toBe(true);
  });

  it('rejects duration_s below 0', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, duration_s: -1 }).success,
    ).toBe(false);
  });

  it('rejects duration_s above 3600', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, duration_s: 3601 })
        .success,
    ).toBe(false);
  });

  it('rejects non-integer duration_s', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, duration_s: 299.5 })
        .success,
    ).toBe(false);
  });

  it('accepts duration_s at boundary values 0 and 3600', () => {
    // score=0 is within ±0 for duration=0, and within ±7200 for duration=3600
    expect(
      patchSessionSchema.safeParse({ ...validPayload, duration_s: 0, score: 0 })
        .success,
    ).toBe(true);
    expect(
      patchSessionSchema.safeParse({ ...validPayload, duration_s: 3600 })
        .success,
    ).toBe(true);
  });

  it('rejects accuracy below 0', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, accuracy: -0.1 }).success,
    ).toBe(false);
  });

  it('rejects accuracy above 100', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, accuracy: 100.1 })
        .success,
    ).toBe(false);
  });

  it('accepts accuracy at boundary values 0 and 100', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, accuracy: 0 }).success,
    ).toBe(true);
    expect(
      patchSessionSchema.safeParse({ ...validPayload, accuracy: 100 }).success,
    ).toBe(true);
  });

  it('rejects score above duration_s × 2 (upper plausibility bound)', () => {
    // duration=300 → max plausible score = 600
    expect(
      patchSessionSchema.safeParse({ ...validPayload, score: 601 }).success,
    ).toBe(false);
  });

  it('rejects score below −duration_s × 2 (lower plausibility bound)', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, score: -601 }).success,
    ).toBe(false);
  });

  it('accepts score at both exact plausibility bounds', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, score: 600 }).success,
    ).toBe(true);
    expect(
      patchSessionSchema.safeParse({ ...validPayload, score: -600 }).success,
    ).toBe(true);
  });

  it('rejects a non-integer score', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, score: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects unknown top-level keys (strict mode)', () => {
    expect(
      patchSessionSchema.safeParse({ ...validPayload, extra: 'value' }).success,
    ).toBe(false);
  });

  it('rejects an invalid ISO datetime in completed_at', () => {
    expect(
      patchSessionSchema.safeParse({
        ...validPayload,
        completed_at: 'not-a-date',
      }).success,
    ).toBe(false);
  });

  it('surfaces a meaningful error message when score is out of plausible range', () => {
    const result = patchSessionSchema.safeParse({
      ...validPayload,
      score: 601,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('plausible'))).toBe(true);
    }
  });
});
