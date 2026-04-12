import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email ??
    'there';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center px-4">
          <span className="text-lg font-semibold">SkyReady</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Signed in as{' '}
            <span className="font-medium text-foreground">{displayName}</span>
            {user?.email && displayName !== user.email ? (
              <span className="text-muted-foreground"> ({user.email})</span>
            ) : null}
          </p>
        </div>
      </main>
    </div>
  );
}
