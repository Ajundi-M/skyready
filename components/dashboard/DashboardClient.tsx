'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  type ModuleData,
  type ModuleColumn,
  type SessionRow,
} from '@/lib/dashboard';
import { fmt, fmtAccuracy, fmtDate, fmtDuration } from '@/lib/format';

type Props = {
  moduleDataList: ModuleData[];
  totalSessions: number;
  totalModules: number;
};

export default function DashboardClient({
  moduleDataList,
  totalSessions,
  totalModules,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>(
    moduleDataList[0]?.id ?? '',
  );

  const activeModule = moduleDataList.find((m) => m.id === activeTab);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Overview strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <OverviewCard label="Total Sessions" value={String(totalSessions)} />
        <OverviewCard label="Modules Trained" value={String(totalModules)} />
        <OverviewCard
          label="Latest Module"
          value={moduleDataList[moduleDataList.length - 1]?.config.label ?? '—'}
        />
      </div>

      {/* ── Module tabs ── */}
      <div>
        <div className="flex gap-1 border-b mb-6">
          {moduleDataList.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === m.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={activeTab === m.id ? { color: m.config.accent } : {}}
            >
              {m.config.label}
              {activeTab === m.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ backgroundColor: m.config.accent }}
                />
              )}
            </button>
          ))}
        </div>

        {activeModule && <ModulePanel module={activeModule} />}
      </div>
    </div>
  );
}

function ModulePanel({ module: m }: { module: ModuleData }) {
  // Build chart data — one point per session, chronological
  const chartData = m.sessions.map((s) => ({
    date: fmtDate(s.completed_at),
    accuracy: s.accuracy != null ? parseFloat(s.accuracy.toFixed(1)) : null,
    score: s.score,
    mean_rt_ms:
      typeof s.metrics?.mean_rt_ms === 'number' ? s.metrics.mean_rt_ms : null,
    correct: typeof s.metrics?.correct === 'number' ? s.metrics.correct : null,
  }));

  const primaryKey = m.config.primaryChart;
  const secondaryKey = m.config.secondaryChart;

  // Stat card values
  const trend =
    m.sessions.length >= 2
      ? (m.sessions[m.sessions.length - 1].accuracy ?? 0) -
        (m.sessions[m.sessions.length - 2].accuracy ?? 0)
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Sessions"
          value={String(m.sessions.length)}
          accent={m.config.accent}
        />
        <StatCard
          label="Best Accuracy"
          value={fmtAccuracy(m.bestAccuracy)}
          accent={m.config.accent}
        />
        <StatCard
          label="Avg Accuracy"
          value={fmtAccuracy(m.avgAccuracy)}
          accent={m.config.accent}
        />
        <StatCard
          label="Trend"
          value={
            trend == null
              ? '—'
              : trend >= 0
                ? `+${trend.toFixed(1)}%`
                : `${trend.toFixed(1)}%`
          }
          accent={m.config.accent}
          highlight={
            trend != null ? (trend >= 0 ? 'positive' : 'negative') : undefined
          }
        />
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Progress over time
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={primaryKey}
                stroke={m.config.accent}
                strokeWidth={2}
                dot={{ r: 3, fill: m.config.accent }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={secondaryKey}
                stroke={`${m.config.accent}99`}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 2, fill: `${m.config.accent}99` }}
                activeDot={{ r: 4, fill: m.config.accent }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length < 2 && (
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Complete at least 2 sessions to see your progress chart.
        </div>
      )}

      {/* Session table */}
      <div>
        <p className="text-sm font-semibold mb-3">Session History</p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                {m.config.columns.map((col) => (
                  <th key={col} className="px-4 py-3 whitespace-nowrap">
                    {COLUMN_LABELS[col]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...m.sessions].reverse().map((s, i) => (
                <tr
                  key={s.id}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}
                >
                  {m.config.columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 tabular-nums whitespace-nowrap"
                    >
                      {renderCell(col, s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  accent: string;
  highlight?: 'positive' | 'negative';
}) {
  const valueColor =
    highlight === 'positive'
      ? '#22c55e'
      : highlight === 'negative'
        ? '#ef4444'
        : undefined;

  return (
    <div
      className="rounded-xl border bg-card px-4 py-3"
      style={{ borderTopColor: accent, borderTopWidth: 2 }}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className="mt-0.5 text-xl font-bold tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ── Column helpers ────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<ModuleColumn, string> = {
  date: 'Date',
  duration: 'Duration',
  score: 'Score',
  accuracy: 'Accuracy',
  skips_detected: 'Skips Detected',
  false_presses: 'False Presses',
  correct: 'Correct',
  errors: 'Errors',
  omissions: 'Omissions',
  mean_rt_ms: 'Mean RT (ms)',
};

function renderCell(col: ModuleColumn, s: SessionRow): string {
  switch (col) {
    case 'date':
      return fmtDate(s.completed_at);
    case 'duration':
      return fmtDuration(s.duration_s);
    case 'score':
      return fmt(s.score);
    case 'accuracy':
      return fmtAccuracy(s.accuracy);
    case 'skips_detected':
      return fmt(
        typeof s.metrics?.skips_detected === 'number'
          ? s.metrics.skips_detected
          : null,
      );
    case 'false_presses':
      return fmt(
        typeof s.metrics?.false_presses === 'number'
          ? s.metrics.false_presses
          : null,
      );
    case 'correct':
      return fmt(
        typeof s.metrics?.correct === 'number' ? s.metrics.correct : null,
      );
    case 'errors':
      return fmt(
        typeof s.metrics?.errors === 'number' ? s.metrics.errors : null,
      );
    case 'omissions':
      return fmt(
        typeof s.metrics?.omissions === 'number' ? s.metrics.omissions : null,
      );
    case 'mean_rt_ms':
      return typeof s.metrics?.mean_rt_ms === 'number'
        ? `${Math.round(s.metrics.mean_rt_ms)} ms`
        : '—';
    default:
      return '—';
  }
}
