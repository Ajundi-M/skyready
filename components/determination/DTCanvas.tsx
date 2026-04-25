'use client';

import { useEffect, useRef } from 'react';
import {
  DT_STIMULUS_COLOUR,
  DT_TIER_NAMES,
  DT_TIER_STIMULI,
  type DTKeyMap,
  type DTMode,
  type DTTier,
} from '@/lib/determination/types';
import { type DTEngineState } from '@/lib/determination/useDTEngine';

type DTCanvasProps = {
  engineState: DTEngineState;
  mode: DTMode;
  tier: DTTier;
  keyMap: DTKeyMap;
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeCtx: CanvasRenderingContext2D = ctx;

  if (typeof safeCtx.roundRect === 'function') {
    safeCtx.beginPath();
    safeCtx.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  safeCtx.beginPath();
  safeCtx.moveTo(x + r, y);
  safeCtx.lineTo(x + width - r, y);
  safeCtx.arcTo(x + width, y, x + width, y + r, r);
  safeCtx.lineTo(x + width, y + height - r);
  safeCtx.arcTo(x + width, y + height, x + width - r, y + height, r);
  safeCtx.lineTo(x + r, y + height);
  safeCtx.arcTo(x, y + height, x, y + height - r, r);
  safeCtx.lineTo(x, y + r);
  safeCtx.arcTo(x, y, x + r, y, r);
  safeCtx.closePath();
}

export default function DTCanvas({
  engineState,
  mode,
  tier,
  keyMap,
}: DTCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (): void => {
      const rect = canvas.getBoundingClientRect();
      const logicalWidth = rect.width;
      const logicalHeight = rect.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const cx = logicalWidth / 2;
      const cy = logicalHeight / 2;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      const stimulus = engineState.currentStimulus;
      if (stimulus !== null) {
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        if (stimulus === 'tone') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 6;
          ctx.stroke();
        } else {
          ctx.fillStyle = DT_STIMULUS_COLOUR[stimulus];
          ctx.fill();
        }
      }

      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      const hudX = 24;
      const hudY = 32;
      const lineHeight = 28;

      const remaining = Math.max(
        0,
        engineState.totalMs - engineState.elapsedMs,
      );
      const mins = Math.floor(remaining / 60_000);
      const secs = Math.floor((remaining % 60_000) / 1000);

      ctx.fillText(`Mode: ${mode.toUpperCase()}`, hudX, hudY);
      ctx.fillText(
        `Tier ${tier} - ${DT_TIER_NAMES[tier]}`,
        hudX,
        hudY + lineHeight,
      );
      ctx.fillText(
        `Time: ${mins}:${String(secs).padStart(2, '0')}`,
        hudX,
        hudY + lineHeight * 2,
      );
      ctx.fillText(
        `Correct: ${engineState.correct}   Errors: ${engineState.errors}`,
        hudX,
        hudY + lineHeight * 3,
      );

      if (engineState.phase === 'practice') {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FACC15';
        ctx.textAlign = 'center';
        ctx.fillText('PRACTICE - responses not recorded', cx, 80);
        ctx.textAlign = 'left';
      }

      if (engineState.phase === 'practice' || engineState.phase === 'live') {
        const activeStimuli = DT_TIER_STIMULI[tier];
        const dotRadius = 8;
        const padX = 12;
        const padY = 8;
        const gap = 12;

        ctx.globalAlpha = engineState.phase === 'practice' ? 1.0 : 0.2;
        ctx.font = 'bold 14px Arial';
        ctx.textBaseline = 'middle';

        const pills = activeStimuli.map((stimulus) => {
          const keyLabel =
            keyMap[stimulus] === ' ' ? 'SPC' : keyMap[stimulus].toUpperCase();
          const keyLabelWidth = ctx.measureText(keyLabel).width;
          const pillWidth = dotRadius * 2 + 8 + keyLabelWidth + padX * 2;
          const pillHeight = dotRadius * 2 + padY * 2;
          return { stimulus, keyLabel, pillWidth, pillHeight };
        });

        const totalRowWidth =
          pills.reduce((sum, pill) => sum + pill.pillWidth, 0) +
          gap * Math.max(0, pills.length - 1);
        let pillX = cx - totalRowWidth / 2;
        const rowBottom = logicalHeight - 48;

        for (const pill of pills) {
          const pillY = rowBottom - pill.pillHeight;

          drawRoundedRect(
            ctx,
            pillX,
            pillY,
            pill.pillWidth,
            pill.pillHeight,
            12,
          );
          ctx.fillStyle = '#1F2937';
          ctx.fill();
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          ctx.stroke();

          const dotCx = pillX + padX + dotRadius;
          const dotCy = pillY + pill.pillHeight / 2;

          ctx.beginPath();
          ctx.arc(dotCx, dotCy, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = DT_STIMULUS_COLOUR[pill.stimulus];
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(pill.keyLabel, dotCx + dotRadius + 8, dotCy);

          pillX += pill.pillWidth + gap;
        }

        ctx.globalAlpha = 1.0;
        ctx.textBaseline = 'top';
      }
    };

    draw();

    const observer = new ResizeObserver(() => {
      draw();
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [engineState, mode, tier, keyMap]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
