import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/nav/TopNav';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()) as { data: { is_admin: boolean } | null; error: unknown };

  return (
    <div>
      <TopNav isAdmin={profile?.is_admin ?? false} />
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
