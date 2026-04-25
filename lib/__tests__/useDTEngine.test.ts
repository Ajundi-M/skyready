import { describe, it, expect } from 'vitest';
import { DT_TIMING } from '../determination/types';

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
    let state: { windowMs: number; streak: number } = {
      windowMs: DT_TIMING.ADAPTIVE_START_MS,
      streak: 0,
    };
    state = applyReward(state.windowMs, state.streak);
    state = applyReward(state.windowMs, state.streak);
    state = applyReward(state.windowMs, state.streak);
    expect(state.windowMs).toBe(
      DT_TIMING.ADAPTIVE_START_MS - DT_TIMING.ADAPTIVE_FASTER_MS,
    );
    expect(state.streak).toBe(0);
  });

  it('does not decrease window before streak reaches 3', () => {
    let state: { windowMs: number; streak: number } = {
      windowMs: DT_TIMING.ADAPTIVE_START_MS,
      streak: 0,
    };
    state = applyReward(state.windowMs, state.streak);
    state = applyReward(state.windowMs, state.streak);
    expect(state.windowMs).toBe(DT_TIMING.ADAPTIVE_START_MS);
    expect(state.streak).toBe(2);
  });

  it('increases window and resets streak after an error', () => {
    let state: { windowMs: number; streak: number } = {
      windowMs: DT_TIMING.ADAPTIVE_START_MS,
      streak: 2,
    };
    state = applyPenalty(state.windowMs);
    expect(state.windowMs).toBe(
      DT_TIMING.ADAPTIVE_START_MS + DT_TIMING.ADAPTIVE_SLOWER_MS,
    );
    expect(state.streak).toBe(0);
  });

  it('never decreases window below the minimum', () => {
    const state = applyReward(
      DT_TIMING.ADAPTIVE_MIN_MS,
      DT_TIMING.ADAPTIVE_STREAK_TARGET - 1,
    );
    expect(state.windowMs).toBe(DT_TIMING.ADAPTIVE_MIN_MS);
  });

  it('never increases window above the maximum', () => {
    const state = applyPenalty(DT_TIMING.ADAPTIVE_MAX_MS);
    expect(state.windowMs).toBe(DT_TIMING.ADAPTIVE_MAX_MS);
  });
});
