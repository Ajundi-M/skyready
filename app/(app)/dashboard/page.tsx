import { createClient } from '@/lib/supabase/server';
import {
  MODULE_REGISTRY,
  type ModuleData,
  type ModuleId,
  type SessionRow,
} from '@/lib/dashboard';
import DashboardClient from '@/components/dashboard/DashboardClient';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? '';

  const { data: rawSessions } = await supabase
    .from('sessions')
    .select('id, module, completed_at, duration_s, score, accuracy, metrics')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true })
    .returns<SessionRow[]>();

  const sessions = rawSessions ?? [];

  // Group by module and compute aggregates
  const moduleDataMap: Partial<Record<ModuleId, ModuleData>> = {};

  for (const moduleId of Object.keys(MODULE_REGISTRY) as ModuleId[]) {
    const config = MODULE_REGISTRY[moduleId];
    const moduleSessions = sessions.filter((s) => s.module === moduleId);
    if (moduleSessions.length === 0) continue;

    const scores = moduleSessions
      .map((s) => s.score)
      .filter((v): v is number => v != null);
    const accuracies = moduleSessions
      .map((s) => s.accuracy)
      .filter((v): v is number => v != null);

    moduleDataMap[moduleId] = {
      id: moduleId,
      config,
      sessions: moduleSessions,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      bestAccuracy: accuracies.length > 0 ? Math.max(...accuracies) : null,
      avgAccuracy:
        accuracies.length > 0
          ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
          : null,
    };
  }

  const moduleDataList = Object.values(moduleDataMap);
  const totalSessions = sessions.length;
  const totalModules = moduleDataList.length;

  if (totalSessions === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
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
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <DashboardClient
        moduleDataList={moduleDataList}
        totalSessions={totalSessions}
        totalModules={totalModules}
      />
    </main>
  );
}
