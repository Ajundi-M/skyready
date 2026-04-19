'use client';

import { useEffect, useRef } from 'react';

interface GameState {
  score: number;
  currentIdx: number;
  isSkipFrame: boolean;
  waitingForInput: boolean;
  skipsEncountered: number;
  skipsDetected: number;
  falsePresses: number;
  timeRemaining: number;
  running: boolean;
  /** True while the page is hidden or the window has lost focus. */
  paused: boolean;
}

export interface SessionResult {
  score: number;
  skipsEncountered: number;
  skipsDetected: number;
  falsePresses: number;
  durationS: number;
  /** Set when the session was abandoned mid-game rather than completed. */
  cancelled?: boolean;
}

interface VendingRingProps {
  sessionDuration?: number;
  onSessionEnd: (result: SessionResult) => void;
  /** Called with partial results when the component unmounts before natural completion. */
  onCancel?: (result: SessionResult) => void;
  showSkipColour?: boolean;
}

/** Probability that each advance is a 2-position skip rather than 1-position step. */
const SKIP_PROBABILITY = 0.15;
/** Jump distance (in positions) for a skip frame. */
const SKIP_JUMP = 2;
/** Milliseconds between dot advances. */
const MOVE_INTERVAL_MS = 500;
/** Total number of circles in the ring. */
const CIRCLE_COUNT = 50;
const RING_RADIUS = 300;
const CANVAS_SIZE = 700;
const CENTER = CANVAS_SIZE / 2;
const ANGLE_STEP = (2 * Math.PI) / CIRCLE_COUNT;
/** Arc length between adjacent circle centres along the ring. */
const CIRCLE_SPACING = (2 * Math.PI * RING_RADIUS) / CIRCLE_COUNT;
const DRAW_RADIUS = CIRCLE_SPACING * 0.35;
const ACTIVE_RADIUS = DRAW_RADIUS - 5;

function getCirclePos(idx: number): { x: number; y: number } {
  const angle = idx * ANGLE_STEP - Math.PI / 2;
  return {
    x: CENTER + RING_RADIUS * Math.cos(angle),
    y: CENTER + RING_RADIUS * Math.sin(angle),
  };
}

export default function VendingRing({
  sessionDuration = 300,
  onSessionEnd,
  onCancel,
  showSkipColour = true,
}: VendingRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    score: 0,
    currentIdx: 0,
    isSkipFrame: false,
    waitingForInput: false,
    skipsEncountered: 0,
    skipsDetected: 0,
    falsePresses: 0,
    timeRemaining: sessionDuration,
    running: false,
    paused: false,
  });

  // Keep stable refs so closures inside the effect always call the latest callbacks
  const onSessionEndRef = useRef(onSessionEnd);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    const state = stateRef.current;

    // Reset all game state for this session
    state.score = 0;
    state.currentIdx = 0;
    state.isSkipFrame = false;
    state.waitingForInput = false;
    state.skipsEncountered = 0;
    state.skipsDetected = 0;
    state.falsePresses = 0;
    state.timeRemaining = sessionDuration;
    state.running = true;
    state.paused = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scale the canvas backing store by the device pixel ratio so it is
    // crisp on retina / HiDPI displays. The CSS size stays at CANVAS_SIZE px.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    // Tracks whether endSession() fired so the cleanup knows not to call onCancel.
    let endedNaturally = false;

    function draw() {
      // Reset the transform at the start of every frame to avoid accumulation,
      // then re-apply the DPR scale so all coordinates remain in CSS pixels.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background
      ctx!.fillStyle = '#000';
      ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Ring outlines
      for (let i = 0; i < CIRCLE_COUNT; i++) {
        const { x, y } = getCirclePos(i);
        ctx!.beginPath();
        ctx!.arc(x, y, DRAW_RADIUS, 0, 2 * Math.PI);
        ctx!.strokeStyle = 'white';
        ctx!.lineWidth = 2;
        ctx!.stroke();
      }

      // Active dot
      const { x, y } = getCirclePos(state.currentIdx);
      ctx!.beginPath();
      ctx!.arc(x, y, ACTIVE_RADIUS, 0, 2 * Math.PI);
      ctx!.fillStyle = state.isSkipFrame && showSkipColour ? 'red' : 'white';
      ctx!.fill();

      // HUD
      const mins = Math.floor(state.timeRemaining / 60);
      const secs = state.timeRemaining % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      ctx!.font = '18px monospace';
      ctx!.fillStyle = 'white';
      ctx!.textBaseline = 'top';
      ctx!.fillText(`Score: ${state.score}`, 16, 12);
      ctx!.fillText(`Time: ${timeStr}`, 16, 36);
    }

    function loop() {
      draw();
      if (state.running) {
        rafId = requestAnimationFrame(loop);
      }
    }

    function endSession() {
      endedNaturally = true;
      state.running = false;
      clearInterval(moveTimer);
      clearInterval(sessionTimer);
      cancelAnimationFrame(rafId);
      onSessionEndRef.current({
        score: state.score,
        skipsEncountered: state.skipsEncountered,
        skipsDetected: state.skipsDetected,
        falsePresses: state.falsePresses,
        durationS: sessionDuration,
      });
    }

    // Advance the active dot every MOVE_INTERVAL_MS milliseconds
    const moveTimer = setInterval(() => {
      if (!state.running || state.paused) return;

      // Penalise a missed skip from the previous frame
      if (state.waitingForInput && state.isSkipFrame) {
        state.score -= 1;
      }

      const roll = Math.random();
      if (roll < SKIP_PROBABILITY) {
        state.currentIdx = (state.currentIdx + SKIP_JUMP) % CIRCLE_COUNT;
        state.isSkipFrame = true;
        state.skipsEncountered++;
      } else {
        state.currentIdx = (state.currentIdx + 1) % CIRCLE_COUNT;
        state.isSkipFrame = false;
      }
      state.waitingForInput = true;
    }, MOVE_INTERVAL_MS);

    // Count down the session clock
    const sessionTimer = setInterval(() => {
      if (!state.running || state.paused) return;
      state.timeRemaining = Math.max(0, state.timeRemaining - 1);
      if (state.timeRemaining <= 0) {
        endSession();
      }
    }, 1000);

    function handleKey(e: KeyboardEvent) {
      if (e.code !== 'Space' || !state.running || state.paused) return;
      e.preventDefault();

      if (state.isSkipFrame && state.waitingForInput) {
        // Correct detection
        state.score += 1;
        state.skipsDetected++;
        state.waitingForInput = false;
      } else if (!state.isSkipFrame) {
        // False press on a normal frame
        state.score -= 1;
        state.falsePresses++;
      }
      // Pressing again after an already-detected skip: no effect
    }

    function handleVisibilityChange() {
      state.paused = document.hidden;
    }

    function handleWindowBlur() {
      state.paused = true;
    }

    function handleWindowFocus() {
      state.paused = false;
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    rafId = requestAnimationFrame(loop);

    return () => {
      state.running = false;
      clearInterval(moveTimer);
      clearInterval(sessionTimer);
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);

      if (!endedNaturally) {
        const elapsedS = sessionDuration - state.timeRemaining;
        onCancelRef.current?.({
          score: state.score,
          skipsEncountered: state.skipsEncountered,
          skipsDetected: state.skipsDetected,
          falsePresses: state.falsePresses,
          durationS: elapsedS,
          cancelled: true,
        });
      }
    };
  }, [sessionDuration, showSkipColour]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="block mx-auto"
    />
  );
}
