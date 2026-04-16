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
}

export interface SessionResult {
  score: number;
  skipsEncountered: number;
  skipsDetected: number;
  falsePresses: number;
  durationS: number;
}

interface VendingRingProps {
  sessionDuration?: number;
  onSessionEnd: (result: SessionResult) => void;
  showSkipColour?: boolean;
}

const CIRCLE_COUNT = 50;
const RING_RADIUS = 300;
const CANVAS_SIZE = 700;
const CENTER = CANVAS_SIZE / 2;
const ANGLE_STEP = (2 * Math.PI) / CIRCLE_COUNT;
// Arc length between adjacent circle centres along the ring
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
  });
  // Keep a stable ref so closures inside the effect always call the latest callback
  const onSessionEndRef = useRef(onSessionEnd);
  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
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

    let rafId = 0;

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Ring outlines
      for (let i = 0; i < CIRCLE_COUNT; i++) {
        const { x, y } = getCirclePos(i);
        ctx.beginPath();
        ctx.arc(x, y, DRAW_RADIUS, 0, 2 * Math.PI);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Active dot
      const { x, y } = getCirclePos(state.currentIdx);
      ctx.beginPath();
      ctx.arc(x, y, ACTIVE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = state.isSkipFrame && showSkipColour ? 'red' : 'white';
      ctx.fill();

      // HUD
      const mins = Math.floor(state.timeRemaining / 60);
      const secs = state.timeRemaining % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      ctx.font = '18px monospace';
      ctx.fillStyle = 'white';
      ctx.textBaseline = 'top';
      ctx.fillText(`Score: ${state.score}`, 16, 12);
      ctx.fillText(`Time: ${timeStr}`, 16, 36);
    }

    function loop() {
      draw();
      if (state.running) {
        rafId = requestAnimationFrame(loop);
      }
    }

    function endSession() {
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

    // Advance the active dot every 500 ms
    const moveTimer = setInterval(() => {
      if (!state.running) return;

      // Penalise a missed skip from the previous frame
      if (state.waitingForInput && state.isSkipFrame) {
        state.score -= 1;
      }

      const roll = Math.random();
      if (roll < 0.15) {
        state.currentIdx = (state.currentIdx + 2) % CIRCLE_COUNT;
        state.isSkipFrame = true;
        state.skipsEncountered++;
      } else {
        state.currentIdx = (state.currentIdx + 1) % CIRCLE_COUNT;
        state.isSkipFrame = false;
      }
      state.waitingForInput = true;
    }, 500);

    // Count down the session clock
    const sessionTimer = setInterval(() => {
      if (!state.running) return;
      state.timeRemaining = Math.max(0, state.timeRemaining - 1);
      if (state.timeRemaining <= 0) {
        endSession();
      }
    }, 1000);

    function handleKey(e: KeyboardEvent) {
      if (e.code !== 'Space' || !state.running) return;
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

    document.addEventListener('keydown', handleKey);
    rafId = requestAnimationFrame(loop);

    return () => {
      state.running = false;
      clearInterval(moveTimer);
      clearInterval(sessionTimer);
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKey);
    };
  }, [sessionDuration]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="block mx-auto"
    />
  );
}
