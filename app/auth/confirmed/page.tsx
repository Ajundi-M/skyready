'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COUNTDOWN_SECONDS = 15;

export default function ConfirmedPage() {
  const router = useRouter();
  const [count, setCount] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (count <= 0) {
      router.push('/login');
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">SkyReady</h1>
          <p className="text-sm text-muted-foreground">Email confirmed</p>
        </div>

        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          <p className="font-medium">Email confirmed — you&apos;re all set.</p>
          <p className="mt-1 text-green-600">
            Redirecting you to sign in&hellip;
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Redirecting in {count}s &mdash;{' '}
          <Link href="/login" className="font-medium underline">
            Sign in now
          </Link>
        </p>
      </div>
    </div>
  );
}
