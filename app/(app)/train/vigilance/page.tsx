'use client';

import { useState } from 'react';
import VendingRing, {
  type SessionResult,
} from '@/components/vigilance/VendingRing';

type GamePhase = 'idle' | 'playing' | 'finished';

const DURATION_OPTIONS: { label: string; value: number }[] = [
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '30 min', value: 1800 },
];

export default function VigilancePage() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [duration, setDuration] = useState(300);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleStart() {
    setStartError(null);
    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      if (!res.ok) {
        setStartError('Could not start session. Please try again.');
        return;
      }
      const { id } = await res.json();
      setActiveSessionId(id);
      setPhase('playing');
    } catch {
      setStartError('Could not start session. Please try again.');
    }
  }

  async function handleSessionEnd(r: SessionResult) {
    setResult(r);
    setPhase('finished');

    if (activeSessionId) {
      const accuracy =
        r.skipsEncountered > 0
          ? Math.round((r.skipsDetected / r.skipsEncountered) * 10000) / 100
          : 0;

      fetch(`/api/sessions/${activeSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_at: new Date().toISOString(),
          duration_s: r.durationS,
          score: r.score,
          accuracy,
          metrics: {
            skips_encountered: r.skipsEncountered,
            skips_detected: r.skipsDetected,
            false_presses: r.falsePresses,
            move_interval_ms: 500,
            circle_count: 50,
          },
        }),
      }).catch(() => {});
    }
  }

  if (phase === 'playing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <VendingRing
          sessionDuration={duration}
          onSessionEnd={handleSessionEnd}
        />
      </div>
    );
  }

  if (phase === 'finished' && result !== null) {
    const accuracy =
      result.skipsEncountered > 0
        ? Math.round((result.skipsDetected / result.skipsEncountered) * 100)
        : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        <h1 className="text-3xl font-bold">Session Complete</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="border rounded-xl p-5 text-center">
            <p className="text-5xl font-mono font-bold">{result.score}</p>
            <p className="text-sm text-muted-foreground mt-2">Final Score</p>
          </div>
          <div className="border rounded-xl p-5 text-center">
            <p className="text-5xl font-mono font-bold">{accuracy}%</p>
            <p className="text-sm text-muted-foreground mt-2">
              Detection Accuracy
            </p>
          </div>
          <div className="border rounded-xl p-5 text-center">
            <p className="text-5xl font-mono font-bold">
              {result.skipsEncountered}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Skips Encountered
            </p>
          </div>
          <div className="border rounded-xl p-5 text-center">
            <p className="text-5xl font-mono font-bold">
              {result.falsePresses}
            </p>
            <p className="text-sm text-muted-foreground mt-2">False Presses</p>
          </div>
        </div>
        <button
          onClick={() => setPhase('idle')}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          Play again
        </button>
      </div>
    );
  }

  // idle
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Vigilance</h1>
        <p className="text-muted-foreground">
          Press{' '}
          <kbd className="border rounded px-1.5 py-0.5 font-mono text-sm">
            Space
          </kbd>{' '}
          whenever the dot skips a position.
        </p>
      </div>

      <div className="flex gap-3">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDuration(opt.value)}
            className={`px-5 py-2 rounded-lg border font-medium transition-colors ${
              duration === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {startError && <p className="text-destructive text-sm">{startError}</p>}

      <button
        onClick={handleStart}
        className="px-10 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Start
      </button>
    </div>
  );
}
