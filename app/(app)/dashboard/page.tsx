import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  fmt,
  fmtAccuracy,
  fmtDate,
  fmtDateTime,
  fmtDuration,
} from '@/lib/format';

type Session = {
  id: string;
  user_id: string;
  module: string | null;
  started_at: string;
  completed_at: string | null;
  duration_s: number | null;
  score: number | null;
  accuracy: number | null;
  metrics: { skips_detected?: number; false_presses?: number } | null;
};

export default async function DashboardPage() {
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from('sessions')
    .select(
      'id, user_id, module, started_at, completed_at, duration_s, score, accuracy, metrics',
    )
    .eq('user_id', user?.id ?? '')
    .not('completed_at', 'is', null)
    .order('started_at', { ascending: true })
    .limit(50)
    .returns<Session[]>();

  const rows = sessions ?? [];

  // Stats
  const totalSessions = rows.length;
  const bestScore =
    rows.length > 0
      ? Math.max(
          ...rows.map((s) => s.score ?? -Infinity).filter((v) => isFinite(v)),
        )
      : null;
  const accuracyValues = rows
    .map((s) => s.accuracy)
    .filter((v): v is number => v != null);
  const avgAccuracy =
    accuracyValues.length > 0
      ? accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length
      : null;
  const latestSession = rows.length > 0 ? rows[rows.length - 1] : null;
  const latestScore = latestSession?.score ?? null;

  // Table: 10 most recent, newest first
  const tableRows = [...rows].reverse().slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-semibold">SkyReady</span>
          <div className="flex items-center gap-4">
            <Link
              href="/train"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Train
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-muted-foreground">
              No sessions yet. Head to{' '}
              <Link
                href="/train"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Train
              </Link>{' '}
              to start your first session.
            </p>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Sessions" value={String(totalSessions)} />
              <StatCard
                label="Best Score"
                value={
                  bestScore != null && isFinite(bestScore)
                    ? String(bestScore)
                    : '—'
                }
              />
              <StatCard
                label="Avg Accuracy"
                value={avgAccuracy != null ? `${avgAccuracy.toFixed(1)}%` : '—'}
              />
              <StatCard
                label="Latest Score"
                value={latestScore != null ? String(latestScore) : '—'}
              />
            </div>

            {/* Sessions table */}
            <div>
              <h2 className="mb-3 text-base font-semibold">Recent Sessions</h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Skips Detected</th>
                      <th className="px-4 py-3">False Presses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((session, i) => (
                      <tr
                        key={session.id}
                        className={
                          i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                          {fmtDateTime(session.started_at)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmtDuration(session.duration_s)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmt(session.score)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmtAccuracy(session.accuracy)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmt(session.metrics?.skips_detected)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {fmt(session.metrics?.false_presses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
