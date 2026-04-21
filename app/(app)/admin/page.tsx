import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InviteCodesPanel } from '@/components/admin/InviteCodesPanel';
import { UsersTable } from '@/components/admin/UsersTable';
import { AdminsTable } from '@/components/admin/AdminsTable';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  const isSuperAdmin = profile?.is_super_admin === true;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Invite Codes</h2>
        <InviteCodesPanel isSuperAdmin={isSuperAdmin} />
      </section>

      {isSuperAdmin && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Admins</h2>
          <AdminsTable currentUserId={user.id} isSuperAdmin={isSuperAdmin} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Users</h2>
        <UsersTable currentUserId={user.id} isSuperAdmin={isSuperAdmin} />
      </section>
    </main>
  );
}
