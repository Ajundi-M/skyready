'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function TopNav({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/dashboard" className="font-bold text-lg">
        SkyReady
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/train">Train</Link>
        <Link href="/dashboard">Dashboard</Link>
        {isAdmin && <Link href="/admin">Admin</Link>}
        <button onClick={handleSignOut}>Sign out</button>
      </div>
    </nav>
  );
}
