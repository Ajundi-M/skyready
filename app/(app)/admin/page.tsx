import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InviteCodesPanel } from '@/components/admin/InviteCodesPanel';
import { UsersTable } from '@/components/admin/UsersTable';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-semibold">SkyReady</span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Invite Codes</h2>
          <InviteCodesPanel />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Users</h2>
          <UsersTable />
        </section>
      </main>
    </div>
  );
}
