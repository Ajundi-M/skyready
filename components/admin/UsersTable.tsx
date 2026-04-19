'use client';

import { useEffect, useState } from 'react';
import { fmtDate } from '@/lib/format';

type User = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  session_count: number;
};

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/users', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json() as Promise<User[]>;
      })
      .then((data) => setUsers(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
    );
  }

  if (fetchError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">{fetchError}</p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No users yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr
              key={user.id}
              className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              <td className="px-4 py-3">
                {user.display_name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                {fmtDate(user.created_at)}
              </td>
              <td className="px-4 py-3 tabular-nums">{user.session_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
