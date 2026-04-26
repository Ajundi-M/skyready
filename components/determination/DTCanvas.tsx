'use client';

import { useEffect, useRef } from 'react';
import {
  DT_STIMULUS_COLOUR,
  DT_STIMULUS_IS_AUDIO,
  DT_VARIANT_NAMES,
  DT_VARIANT_STIMULI,
  type DTKeyMap,
  type DTMode,
  type DTStimulus,
  type DTVariant,
} from '@/lib/determination/types';
import { type DTEngineState } from '@/lib/determination/useDTEngine';

type DTCanvasProps = {
  engineState: DTEngineState;
  mode: DTMode;
  variant: DTVariant;
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
  variant,
  keyMap,
}: DTCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function draw(): void {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctxOrNull = canvas.getContext('2d');
      if (!ctxOrNull) return;
      const ctx: CanvasRenderingContext2D = ctxOrNull;

      const rect = canvas.getBoundingClientRect();
      const logicalWidth = rect.width;
      const logicalHeight = rect.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const cx = logicalWidth / 2;
      const cyBase = logicalHeight * 0.62;

      // 1. BACKGROUND
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // ── STIMULUS DEFINITIONS ────────────────────────────────────────────────

      const activeStimuli = DT_VARIANT_STIMULI[variant];
      const current = engineState.currentStimulus;

      // ── HELPER: is a stimulus active right now? ──────────────────────────────
      function isActive(stimulus: DTStimulus): boolean {
        return current === stimulus;
      }

      // ── HELPER: draw opacity ─────────────────────────────────────────────────
      // Active = 1.0, Dimmed = 0.18
      function stimulusAlpha(stimulus: DTStimulus): number {
        return isActive(stimulus) ? 1.0 : 0.45;
      }

      // ── 2. PEDALS ──────────────────────────────────────────────────────────────
      // Only draw pedals if variant includes foot stimuli (always true for both variants)

      const pedalW = 94;
      const pedalH = 118;
      const pedalY = Math.round(logicalHeight * 0.12);
      const hingeH = 14;
      const hingeY = pedalY - hingeH + 2;
      const ledgeH = 10;

      // DIMMED colour values
      const dimPedalFill = '#2e2e2e';
      const dimHingeFill = '#3a3a3a';
      const dimStroke = '#4a4a4a';
      const dimDotFill = '#1a1a1a';
      const dimLabelCol = '#555555';

      // ACTIVE colour values
      const actPedalFill = '#5c5c5c';
      const actHingeFill = '#a0a0a0';
      const actStroke = '#d0d0d0';
      const actDotFill = '#888888';
      const actLabelCol = '#ffffff';

      function drawPedal(
        pedX: number,
        stimulus: DTStimulus,
        label: string,
        keyLabel: string,
      ): void {
        const active = isActive(stimulus);
        const pedalFill = active ? actPedalFill : dimPedalFill;
        const hingeFill = active ? actHingeFill : dimHingeFill;
        const stroke = active ? actStroke : dimStroke;
        const dotFill = active ? actDotFill : dimDotFill;
        const labelCol = active ? actLabelCol : dimLabelCol;
        const sw = active ? 2 : 1;

        // Hinge bar (top)
        drawRoundedRect(ctx, pedX, hingeY, pedalW, hingeH, 5);
        ctx.fillStyle = hingeFill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        ctx.stroke();

        // Hinge bolts
        const boltY = hingeY + hingeH / 2;
        ctx.beginPath();
        ctx.arc(pedX + 10, boltY, 3, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#dddddd' : '#555555';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pedX + pedalW - 10, boltY, 3, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#dddddd' : '#555555';
        ctx.fill();

        // Main pedal body
        drawRoundedRect(ctx, pedX, pedalY, pedalW, pedalH, 6);
        ctx.fillStyle = pedalFill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        ctx.stroke();

        // Grip dots — 3 cols × 4 rows
        const colX = [pedX + 25, pedX + 47, pedX + 69];
        const rowY = [pedalY + 21, pedalY + 40, pedalY + 59, pedalY + 78];
        for (const rx of colX) {
          for (const ry of rowY) {
            ctx.beginPath();
            ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = dotFill;
            ctx.fill();
          }
        }

        // Bottom ledge
        drawRoundedRect(ctx, pedX, pedalY + pedalH, pedalW, ledgeH, 4);
        ctx.fillStyle = active ? '#999999' : '#333333';
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        ctx.stroke();

        // Label below pedal
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = labelCol;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
          `${label} · ${keyLabel === ' ' ? 'SPC' : keyMap[stimulus].toUpperCase()}`,
          pedX + pedalW / 2,
          pedalY + pedalH + ledgeH + 8,
        );
      }

      // Left pedal — foot_left
      const leftPedalX = cx - pedalW - 16;
      const rightPedalX = cx + 16;

      if (activeStimuli.includes('foot_left')) {
        drawPedal(leftPedalX, 'foot_left', 'LEFT', 'Z');
      }
      if (activeStimuli.includes('foot_right')) {
        drawPedal(rightPedalX, 'foot_right', 'RIGHT', '/');
      }

      // ── 3. COLOUR CIRCLES ──────────────────────────────────────────────────────
      // Layout: green far-left lower, yellow left-inner higher,
      //         red right-inner higher, blue far-right lower
      // Only draw circles that are in the active stimulus pool

      type CircleDef = {
        stimulus: DTStimulus;
        x: number;
        y: number;
        r: number;
      };

      const circles: CircleDef[] = [
        { stimulus: 'green', x: cx - 212, y: cyBase + 90, r: 62 },
        { stimulus: 'yellow', x: cx - 78, y: cyBase + 10, r: 62 },
        { stimulus: 'red', x: cx + 78, y: cyBase + 10, r: 62 },
        { stimulus: 'blue', x: cx + 212, y: cyBase + 90, r: 62 },
      ];

      for (const c of circles) {
        if (!activeStimuli.includes(c.stimulus as never)) continue;

        const alpha = stimulusAlpha(c.stimulus);
        const colour = DT_STIMULUS_COLOUR[c.stimulus];
        const active = isActive(c.stimulus);

        // --- circle fill ---
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.fill();
        if (active) {
          ctx.strokeStyle = colour;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();

        // --- key label inside circle ---
        const keyVal = keyMap[c.stimulus] ?? '';
        const keyDisplay = keyVal === ' ' ? 'SPC' : keyVal.toUpperCase();
        ctx.save();
        ctx.globalAlpha = active ? 1.0 : 0.5;
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = active ? '#ffffff' : colour;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(keyDisplay, c.x, c.y);
        ctx.restore();
      }

      // ── 4. TONE STIMULI ────────────────────────────────────────────────────────
      // NO visual rendering for tone_left or tone_right.
      // Audio only. Canvas does not change when a tone plays.
      // This section is intentionally empty.

      // ── 5. HUD (top-left) ──────────────────────────────────────────────────────
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.65;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const hudX = 22;
      const hudY = 28;
      const lineH = 20;

      const remaining = Math.max(
        0,
        engineState.totalMs - engineState.elapsedMs,
      );
      const mins = Math.floor(remaining / 60_000);
      const secs = Math.floor((remaining % 60_000) / 1000);

      ctx.fillText(`Mode: ${mode.toUpperCase()}`, hudX, hudY);
      ctx.fillText(DT_VARIANT_NAMES[variant], hudX, hudY + lineH);
      ctx.fillText(
        `Time: ${mins}:${String(secs).padStart(2, '0')}`,
        hudX,
        hudY + lineH * 2,
      );
      ctx.fillText(
        `Correct: ${engineState.correct}   Errors: ${engineState.errors}`,
        hudX,
        hudY + lineH * 3,
      );
      ctx.globalAlpha = 1.0;

      // ── 6. PRACTICE LABEL ──────────────────────────────────────────────────────
      if (engineState.phase === 'practice') {
        ctx.font = '15px Arial';
        ctx.fillStyle = '#FACC15';
        ctx.globalAlpha = 0.9;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('PRACTICE — responses not recorded', cx, 22);
        ctx.globalAlpha = 1.0;
      }

      // ── 7. KEY INDICATOR PILLS (practice phase only, bottom center) ────────────
      if (engineState.phase === 'practice' || engineState.phase === 'live') {
        const pillStimuli = activeStimuli.filter(
          (s) => !DT_STIMULUS_IS_AUDIO[s],
        );

        const dotR = 7;
        const padX = 10;
        const padY = 6;
        const gap = 8;

        ctx.font = 'bold 12px Arial';

        const pills = pillStimuli.map((stimulus) => {
          const keyVal = keyMap[stimulus];
          const keyLabel =
            keyVal === ' '
              ? 'SPC'
              : keyVal === 'enter'
                ? 'ENT'
                : keyVal.toUpperCase();
          const keyW = ctx.measureText(keyLabel).width;
          const pillW = dotR * 2 + 6 + keyW + padX * 2;
          const pillH = dotR * 2 + padY * 2;
          return { stimulus, keyLabel, pillW, pillH };
        });

        const totalW =
          pills.reduce((s, p) => s + p.pillW, 0) + gap * (pills.length - 1);
        let pillX = cx - totalW / 2;
        const pillY = logicalHeight - 44;

        ctx.globalAlpha = engineState.phase === 'practice' ? 1.0 : 0.2;

        for (const pill of pills) {
          const pY = pillY - pill.pillH;
          drawRoundedRect(ctx, pillX, pY, pill.pillW, pill.pillH, 12);
          ctx.fillStyle = '#1F2937';
          ctx.fill();
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          ctx.stroke();

          const dotCx = pillX + padX + dotR;
          const dotCy = pY + pill.pillH / 2;
          ctx.beginPath();
          ctx.arc(dotCx, dotCy, dotR, 0, Math.PI * 2);
          ctx.fillStyle = DT_STIMULUS_COLOUR[pill.stimulus];
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(pill.keyLabel, dotCx + dotR + 6, dotCy);

          pillX += pill.pillW + gap;
        }

        ctx.globalAlpha = 1.0;
      }
    }

    draw();

    const observer = new ResizeObserver(() => {
      draw();
    });
    observer.observe(canvasRef.current!);
    return () => {
      observer.disconnect();
    };
  }, [engineState, mode, variant, keyMap]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
