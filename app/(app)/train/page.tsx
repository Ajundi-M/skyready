import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function TrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSuperAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();
    isSuperAdmin = profile?.is_super_admin === true;
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Train</h1>
      <div className="grid gap-4">
        <Link
          href="/train/vigilance"
          className="block border rounded-xl p-6 hover:bg-accent transition-colors"
        >
          <h2 className="text-xl font-semibold">Vigilance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sustained attention · 5–30 min sessions
          </p>
        </Link>

        {isSuperAdmin ? (
          <Link
            href="/train/determination"
            className="block border rounded-xl p-6 hover:bg-accent transition-colors"
          >
            <h2 className="text-xl font-semibold">Determination Test</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-limb reaction · Adaptive pacing · Full aviation battery
            </p>
          </Link>
        ) : (
          <Link
            href="/train/determination"
            className="block border border-dashed rounded-xl p-6 hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold">Determination Test</h2>
              <span className="text-xs font-medium bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                Coming soon · Beta
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-limb reaction · Adaptive pacing · Full aviation battery
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              This module is under development. You can try it and share your
              feedback.
            </p>
          </Link>
        )}
      </div>
    </main>
  );
}
