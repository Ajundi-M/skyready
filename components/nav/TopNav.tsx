'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function TopNav({
  isAdmin,
  displayName,
}: {
  isAdmin: boolean;
  displayName: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
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
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold select-none">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-foreground">{displayName}</span>
          </div>
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
