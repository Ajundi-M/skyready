import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fmt, fmtAccuracy, fmtDateTime, fmtDuration } from '@/lib/format';

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

/** Row returned by the PostgREST aggregate query for session stats. */
type StatsRow = {
  count: number;
  max: number | null;
  avg: number | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? '';

  // Two parallel queries:
  //   1. Aggregate query — the DB computes COUNT, MAX(score), AVG(accuracy).
  //      No row limit needed; Postgres does the aggregation server-side.
  //   2. Table query — the 10 most recent completed sessions for display.
  //
  // Previously a single 50-row fetch was used for both. That approach computed
  // stats only from the oldest 50 sessions (ascending order bug) and returned
  // far more data than the table needed.
  const [statsResult, tableResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('count(), score.max(), accuracy.avg()')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .returns<StatsRow[]>(),
    supabase
      .from('sessions')
      .select(
        'id, user_id, module, started_at, completed_at, duration_s, score, accuracy, metrics',
      )
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(10)
      .returns<Session[]>(),
  ]);

  const stats = statsResult.data?.[0];
  const totalSessions = stats?.count ?? 0;
  const bestScore = stats?.max ?? null;
  const avgAccuracy = stats?.avg ?? null;

  const tableRows = tableResult.data ?? [];
  // Latest score comes from the first row of the DESC-ordered table query.
  const latestScore = tableRows[0]?.score ?? null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {totalSessions === 0 ? (
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
              value={bestScore != null ? String(bestScore) : '—'}
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
                      className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
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
