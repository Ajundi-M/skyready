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
    <nav className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="font-bold text-lg">
          SkyReady
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/train"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Train
          </Link>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
