'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDTEngine } from '@/lib/determination/useDTEngine';
import DTCanvas from '@/components/determination/DTCanvas';
import DTPreSessionScreen from '@/components/determination/DTPreSessionScreen';
import DTSessionSummary from '@/components/determination/DTSessionSummary';
import DTKeyRemapModal from '@/components/determination/DTKeyRemapModal';
import {
  DT_DEFAULT_KEY_MAP,
  type DTKeyMap,
  type DTMetrics,
  type DTMode,
  type DTVariant,
} from '@/lib/determination/types';

type PagePhase = 'preSession' | 'practice' | 'live' | 'summary' | 'saving';

export default function DeterminationPage() {
  const router = useRouter();

  const [pagePhase, setPagePhase] = useState<PagePhase>('preSession');
  const [variant, setVariant] = useState<DTVariant | null>(null);
  const [mode, setMode] = useState<DTMode | null>(null);
  const [keyMap, setKeyMap] = useState<DTKeyMap>(DT_DEFAULT_KEY_MAP);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DTMetrics | null>(null);
  const [remapOpen, setRemapOpen] = useState(false);
  const [showEscHint, setShowEscHint] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Safe fallbacks so hooks always receive valid props
  const safeVariant: DTVariant = variant ?? 'visual';
  const safeMode = mode ?? 'action';

  // Guards handleLiveComplete from firing after the user cancels mid-live.
  // cancel() → finishSession() → onComplete() path would otherwise race with
  // the setPagePhase('preSession') in handleCancel.
  const cancelledRef = useRef(false);

  // ── Callbacks and engine instances ────────────────────────────────────────
  // Order matters: handleLiveComplete → liveEngine → handlePracticeComplete
  // → practiceEngine. Each declaration depends on the one above it.

  const handleLiveComplete = useCallback((result: DTMetrics) => {
    if (cancelledRef.current) return;
    setMetrics(result);
    setPagePhase('summary');
  }, []);

  // Always mounted — hooks cannot be conditional.
  const liveEngine = useDTEngine({
    variant: safeVariant,
    mode: safeMode,
    keyMap,
    isPractice: false,
    onComplete: handleLiveComplete,
  });

  const handlePracticeComplete = useCallback(() => {
    setPagePhase('live');
  }, []);

  const practiceEngine = useDTEngine({
    variant: safeVariant,
    mode: safeMode,
    keyMap,
    isPractice: true,
    onComplete: handlePracticeComplete,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = useCallback(
    async (config: { variant: DTVariant; mode: DTMode; keyMap: DTKeyMap }) => {
      setStartError(null);
      setVariant(config.variant);
      setMode(config.mode);
      setKeyMap(config.keyMap);

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'determination' }),
      });

      if (!res.ok) {
        setStartError('Could not start session. Please try again.');
        return;
      }

      const { id } = (await res.json()) as { id: string };
      setSessionId(id);
      setShowEscHint(true);
      setPagePhase('practice');
    },
    [],
  );

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    if (pagePhase === 'practice') practiceEngine.cancel();
    if (pagePhase === 'live') liveEngine.cancel();
    setPagePhase('preSession');
    setSessionId(null);
    // Clear the flag after the current call stack so any synchronous
    // onComplete callbacks that fire during cancel() are suppressed,
    // but the flag does not bleed into the next session.
    setTimeout(() => {
      cancelledRef.current = false;
    }, 100);
  }, [pagePhase, practiceEngine, liveEngine]);

  const handleSave = useCallback(async () => {
    if (!sessionId || !metrics) return;
    setPagePhase('saving');

    const total = metrics.correct + metrics.errors + metrics.omissions;
    const accuracy = total === 0 ? 0 : (metrics.correct / total) * 100;

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_at: new Date().toISOString(),
          duration_s: Math.round(
            (metrics.mean_rt_ms * metrics.total_stimuli) / 1000,
          ),
          score: metrics.correct,
          accuracy: parseFloat(accuracy.toFixed(2)),
          metrics,
        }),
      });

      if (!res.ok) {
        setStartError('Could not save session. Please try again.');
        setPagePhase('summary');
        return;
      }

      router.push('/dashboard');
    } catch {
      setStartError('Could not save session. Please try again.');
      setPagePhase('summary');
    }
  }, [sessionId, metrics, router]);

  const handleDiscard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleKeyMapSave = useCallback((newMap: DTKeyMap): void => {
    setKeyMap(newMap);
    setRemapOpen(false);
    // Fire-and-forget — persist preference without blocking the UI
    fetch('/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { dt_keys: newMap } }),
    }).catch(() => {});
  }, []);

  // ── Esc key: cancel active session ────────────────────────────────────────

  useEffect(() => {
    if (pagePhase !== 'practice' && pagePhase !== 'live') return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pagePhase, handleCancel]);

  // ── Esc hint: visible for 3 s at the start of each practice phase ─────────

  useEffect(() => {
    if (!showEscHint) return;
    const t = setTimeout(() => setShowEscHint(false), 3000);
    return () => clearTimeout(t);
  }, [showEscHint]);

  // ── Phase-driven engine starts ────────────────────────────────────────────
  // Calling start() from a useEffect guarantees the engine was created with
  // the correct tier/mode/keyMap from the current render, not a stale closure.

  useEffect(() => {
    if (pagePhase === 'practice') {
      practiceEngine.start();
    }
  }, [pagePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pagePhase === 'live') {
      liveEngine.start();
    }
  }, [pagePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  // TopNav and auth guard are both provided by app/(app)/layout.tsx.

  if (pagePhase === 'preSession') {
    return (
      <>
        {startError && <p className="text-red-500 text-center">{startError}</p>}
        <DTPreSessionScreen
          onStart={handleStart}
          onEditKeys={() => setRemapOpen(true)}
          keyMap={keyMap}
          onKeyMapChange={setKeyMap}
        />
        <DTKeyRemapModal
          open={remapOpen}
          activeVariant={safeVariant}
          initialKeyMap={keyMap}
          onSave={handleKeyMapSave}
          onClose={() => setRemapOpen(false)}
        />
      </>
    );
  }

  if (pagePhase === 'practice' || pagePhase === 'live') {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-hidden">
        <DTCanvas
          engineState={
            pagePhase === 'practice' ? practiceEngine.state : liveEngine.state
          }
          mode={safeMode}
          variant={safeVariant}
          keyMap={keyMap}
        />
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/40 select-none transition-opacity duration-1000 ${
            showEscHint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Press Esc to cancel session
        </div>
      </div>
    );
  }

  if (pagePhase === 'summary' || pagePhase === 'saving') {
    return metrics ? (
      <DTSessionSummary
        metrics={metrics}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={pagePhase === 'saving'}
      />
    ) : null;
  }

  return null;
}
