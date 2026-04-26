'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DT_DEFAULT_KEY_MAP,
  DT_STIMULUS_IS_AUDIO,
  DT_STIMULI,
  DT_TONE_PAN,
  DT_VARIANT_STIMULI,
  DT_TIMING,
  DT_SESSION_DURATION_MS,
  type DTKeyMap,
  type DTMetrics,
  type DTMode,
  type DTStimulus,
  type DTStimulusMetric,
  type DTVariant,
} from '@/lib/determination/types';

export type DTEngineConfig = {
  variant: DTVariant;
  mode: DTMode;
  keyMap: DTKeyMap;
  isPractice: boolean;
  onComplete: (metrics: DTMetrics) => void;
};

export type DTEngineState = {
  phase: 'idle' | 'practice' | 'live' | 'complete';
  currentStimulus: DTStimulus | null;
  correct: number;
  errors: number;
  omissions: number;
  delayed: number;
  elapsedMs: number;
  totalMs: number;
  windowMs: number;
  correctStreak: number;
};

export type DTEngineControls = {
  state: DTEngineState;
  start: () => void;
  cancel: () => void;
};

function getInitialWindowMs(mode: DTMode): number {
  if (mode === 'action') return Number.POSITIVE_INFINITY;
  if (mode === 'reaction') return DT_TIMING.REACTION_WINDOW_MS;
  return DT_TIMING.ADAPTIVE_START_MS;
}

function getIsiMs(mode: DTMode): number {
  if (mode === 'action') return DT_TIMING.ACTION_ISI_MS;
  if (mode === 'reaction') return DT_TIMING.REACTION_ISI_MS;
  return DT_TIMING.ADAPTIVE_ISI_MS;
}

function computeMedian(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function buildInitialState(config: DTEngineConfig): DTEngineState {
  return {
    phase: 'idle',
    currentStimulus: null,
    correct: 0,
    errors: 0,
    omissions: 0,
    delayed: 0,
    elapsedMs: 0,
    totalMs: config.isPractice
      ? DT_TIMING.PRACTICE_DURATION_MS
      : DT_SESSION_DURATION_MS[config.mode],
    windowMs: getInitialWindowMs(config.mode),
    correctStreak: 0,
  };
}

export function useDTEngine(config: DTEngineConfig): DTEngineControls {
  function playTone(pan: number, audioCtx: AudioContext): void {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const pannerNode = audioCtx.createStereoPanner();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.3,
    );
    pannerNode.pan.setValueAtTime(pan, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  }

  const [state, setState] = useState<DTEngineState>(() =>
    buildInitialState(config),
  );

  const rafHandleRef = useRef<number | null>(null);
  const prevTimestampRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  const showCountdownRef = useRef<number>(0);
  const isiCountdownRef = useRef<number>(0);
  const inISIRef = useRef<boolean>(false);
  const stimulusOnsetTimeRef = useRef<number | null>(null);
  const lastStimulusRef = useRef<DTStimulus | null>(null);
  const rtListRef = useRef<number[]>([]);
  const perStimulusRef = useRef<Record<DTStimulus, DTStimulusMetric>>(
    DT_STIMULI.reduce(
      (acc, stimulus) => {
        acc[stimulus] = { correct: 0, errors: 0, mean_rt_ms: 0 };
        return acc;
      },
      {} as Record<DTStimulus, DTStimulusMetric>,
    ),
  );
  const perStimulusRtRef = useRef<Record<DTStimulus, number[]>>(
    DT_STIMULI.reduce(
      (acc, stimulus) => {
        acc[stimulus] = [];
        return acc;
      },
      {} as Record<DTStimulus, number[]>,
    ),
  );
  const reverseKeyMapRef = useRef<Record<string, DTStimulus>>({});
  const correctStreakRef = useRef<number>(0);
  const windowMsRef = useRef<number>(getInitialWindowMs(config.mode));
  const activePoolRef = useRef<readonly DTStimulus[]>(
    DT_VARIANT_STIMULI[config.variant],
  );
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentStimulusRef = useRef<DTStimulus | null>(null);
  const correctRef = useRef<number>(0);
  const errorsRef = useRef<number>(0);
  const omissionsRef = useRef<number>(0);
  const delayedRef = useRef<number>(0);
  const phaseRef = useRef<DTEngineState['phase']>('idle');
  const hasFinishedRef = useRef<boolean>(false);

  const keydownHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});

  const totalMs = config.isPractice
    ? DT_TIMING.PRACTICE_DURATION_MS
    : DT_SESSION_DURATION_MS[config.mode];

  const applyAdaptiveReward = useCallback((): void => {
    if (config.mode !== 'adaptive') return;
    correctStreakRef.current += 1;
    if (correctStreakRef.current >= DT_TIMING.ADAPTIVE_STREAK_TARGET) {
      windowMsRef.current = Math.max(
        DT_TIMING.ADAPTIVE_MIN_MS,
        windowMsRef.current - DT_TIMING.ADAPTIVE_FASTER_MS,
      );
      correctStreakRef.current = 0;
    }
  }, [config.mode]);

  const applyAdaptivePenalty = useCallback((): void => {
    if (config.mode !== 'adaptive') return;
    correctStreakRef.current = 0;
    windowMsRef.current = Math.min(
      DT_TIMING.ADAPTIVE_MAX_MS,
      windowMsRef.current + DT_TIMING.ADAPTIVE_SLOWER_MS,
    );
  }, [config.mode]);

  const snapshotState = useCallback((): void => {
    setState({
      phase: phaseRef.current,
      currentStimulus: currentStimulusRef.current,
      correct: correctRef.current,
      errors: errorsRef.current,
      omissions: omissionsRef.current,
      delayed: delayedRef.current,
      elapsedMs: elapsedRef.current,
      totalMs,
      windowMs: windowMsRef.current,
      correctStreak: correctStreakRef.current,
    });
  }, [totalMs]);

  const pickNextStimulus = useCallback((): DTStimulus => {
    const pool = activePoolRef.current;
    const firstIndex = Math.floor(Math.random() * pool.length);
    let chosen = pool[firstIndex];
    if (pool.length > 1 && chosen === lastStimulusRef.current) {
      const secondIndex = Math.floor(Math.random() * pool.length);
      chosen = pool[secondIndex];
    }
    lastStimulusRef.current = chosen;
    return chosen;
  }, []);

  const finishSession = useCallback((): void => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
    window.removeEventListener('keydown', keydownHandlerRef.current);
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    for (const stimulus of activePoolRef.current) {
      const stimulusRt = perStimulusRtRef.current[stimulus];
      const meanRt =
        stimulusRt.length > 0
          ? stimulusRt.reduce((sum, rt) => sum + rt, 0) / stimulusRt.length
          : 0;
      perStimulusRef.current[stimulus] = {
        ...perStimulusRef.current[stimulus],
        mean_rt_ms: meanRt,
      };
    }

    const meanRtMs =
      rtListRef.current.length > 0
        ? rtListRef.current.reduce((sum, rt) => sum + rt, 0) /
          rtListRef.current.length
        : 0;
    const medianRtMs = computeMedian(rtListRef.current);

    const metrics: DTMetrics = {
      variant: config.variant,
      mode: config.mode,
      key_map_snapshot: config.keyMap,
      correct: correctRef.current,
      delayed: delayedRef.current,
      errors: errorsRef.current,
      omissions: omissionsRef.current,
      total_stimuli:
        correctRef.current +
        delayedRef.current +
        errorsRef.current +
        omissionsRef.current,
      mean_rt_ms: meanRtMs,
      median_rt_ms: medianRtMs,
      final_window_ms: config.mode === 'adaptive' ? windowMsRef.current : null,
      per_stimulus: perStimulusRef.current,
    };

    phaseRef.current = 'complete';
    snapshotState();
    config.onComplete(metrics);
  }, [config, snapshotState]);

  const tickRef = useRef<(timestamp: number) => void>(() => {});
  useEffect(() => {
    tickRef.current = (timestamp: number): void => {
      if (phaseRef.current !== 'practice' && phaseRef.current !== 'live')
        return;

      if (prevTimestampRef.current === null) {
        prevTimestampRef.current = timestamp;
      }
      const delta = Math.min(timestamp - prevTimestampRef.current, 100);
      elapsedRef.current += delta;
      prevTimestampRef.current = timestamp;

      if (elapsedRef.current >= totalMs) {
        finishSession();
        return;
      }

      if (!inISIRef.current) {
        if (currentStimulusRef.current === null) {
          const next = pickNextStimulus();
          currentStimulusRef.current = next;
          stimulusOnsetTimeRef.current = performance.now();
          if (DT_STIMULUS_IS_AUDIO[next] && audioCtxRef.current) {
            const pan = DT_TONE_PAN[next] ?? 0;
            playTone(pan, audioCtxRef.current);
          }
          showCountdownRef.current = Number.isFinite(windowMsRef.current)
            ? windowMsRef.current
            : Number.MAX_SAFE_INTEGER;
        }

        showCountdownRef.current -= delta;

        if (
          showCountdownRef.current <= 0 &&
          currentStimulusRef.current !== null
        ) {
          omissionsRef.current += 1;
          applyAdaptivePenalty();
          inISIRef.current = true;
          isiCountdownRef.current = getIsiMs(config.mode);
          currentStimulusRef.current = null;
          stimulusOnsetTimeRef.current = null;
        }
      } else {
        isiCountdownRef.current -= delta;
        if (isiCountdownRef.current <= 0) {
          inISIRef.current = false;
        }
      }

      snapshotState();
      rafHandleRef.current = requestAnimationFrame(tickRef.current);
    };
  }, [
    applyAdaptivePenalty,
    config.mode,
    finishSession,
    pickNextStimulus,
    snapshotState,
    totalMs,
  ]);

  const start = useCallback((): void => {
    if (phaseRef.current === 'practice' || phaseRef.current === 'live') return;

    hasFinishedRef.current = false;
    prevTimestampRef.current = null;
    elapsedRef.current = 0;
    showCountdownRef.current = 0;
    isiCountdownRef.current = 0;
    inISIRef.current = false;
    stimulusOnsetTimeRef.current = null;
    lastStimulusRef.current = null;
    rtListRef.current = [];
    reverseKeyMapRef.current = {};
    correctStreakRef.current = 0;
    windowMsRef.current = getInitialWindowMs(config.mode);
    activePoolRef.current = DT_VARIANT_STIMULI[config.variant];
    currentStimulusRef.current = null;
    correctRef.current = 0;
    errorsRef.current = 0;
    omissionsRef.current = 0;
    delayedRef.current = 0;

    for (const stimulus of activePoolRef.current) {
      perStimulusRef.current[stimulus] = {
        correct: 0,
        errors: 0,
        mean_rt_ms: 0,
      };
      perStimulusRtRef.current[stimulus] = [];
    }

    for (const [stimulus, key] of Object.entries(config.keyMap)) {
      const normalizedKey = (
        key || DT_DEFAULT_KEY_MAP[stimulus as DTStimulus]
      ).toLowerCase();
      reverseKeyMapRef.current[normalizedKey] = stimulus as DTStimulus;
    }

    // Guard: if the key map has fewer entries than the active stimulus pool,
    // the preferences have not loaded yet. Abort rather than silently treating
    // every keypress as an omission.
    if (
      Object.keys(reverseKeyMapRef.current).length <
      activePoolRef.current.length
    ) {
      console.warn(
        '[useDTEngine] start() aborted: keyMap has fewer entries than active stimuli. Preferences may not have loaded yet.',
      );
      return;
    }

    audioCtxRef.current = new AudioContext();

    keydownHandlerRef.current = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      const pressedStimulus = reverseKeyMapRef.current[key];
      if (pressedStimulus === undefined) return;

      if (inISIRef.current || currentStimulusRef.current === null) {
        errorsRef.current += 1;
        correctStreakRef.current = 0;
        applyAdaptivePenalty();
        snapshotState();
        return;
      }

      if (
        pressedStimulus === currentStimulusRef.current &&
        showCountdownRef.current > 0
      ) {
        const onset = stimulusOnsetTimeRef.current ?? performance.now();
        const rt = performance.now() - onset;
        correctRef.current += 1;
        rtListRef.current.push(rt);
        perStimulusRef.current[pressedStimulus].correct += 1;
        perStimulusRtRef.current[pressedStimulus].push(rt);
        applyAdaptiveReward();
        inISIRef.current = true;
        isiCountdownRef.current = getIsiMs(config.mode);
        currentStimulusRef.current = null;
        stimulusOnsetTimeRef.current = null;
        snapshotState();
        return;
      }

      if (
        pressedStimulus === currentStimulusRef.current &&
        showCountdownRef.current <= 0
      ) {
        delayedRef.current += 1;
        snapshotState();
        return;
      }

      errorsRef.current += 1;
      perStimulusRef.current[pressedStimulus].errors += 1;
      correctStreakRef.current = 0;
      applyAdaptivePenalty();
      snapshotState();
    };

    window.addEventListener('keydown', keydownHandlerRef.current);

    phaseRef.current = config.isPractice ? 'practice' : 'live';
    snapshotState();
    rafHandleRef.current = requestAnimationFrame(tickRef.current);
  }, [applyAdaptivePenalty, applyAdaptiveReward, config, snapshotState]);

  const cancel = useCallback((): void => {
    finishSession();
  }, [finishSession]);

  // Keep a ref to finishSession so the unmount cleanup always calls the latest
  // version without listing it as a dep — listing it caused the cleanup to fire
  // on every render where config changed identity, triggering onComplete early.
  const finishSessionRef = useRef(finishSession);
  useEffect(() => {
    finishSessionRef.current = finishSession;
  }); // no deps — syncs ref after every render

  useEffect(() => {
    return () => {
      if (phaseRef.current !== 'idle' && phaseRef.current !== 'complete') {
        finishSessionRef.current();
      }
    };
  }, []); // empty — fires only on unmount

  return { state, start, cancel };
}
