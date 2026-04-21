'use client';

import { useEffect, useState } from 'react';
import { fmtDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  session_count: number;
  is_admin: boolean;
  banned_until: string | null;
};

type Props = {
  currentUserId: string;
  isSuperAdmin: boolean;
};

export function UsersTable({ currentUserId, isSuperAdmin }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

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

  async function handlePatch(
    id: string,
    action: 'toggle_admin' | 'suspend' | 'unsuspend',
  ) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast({
        title: body.error ?? 'Something went wrong',
        variant: 'destructive',
      });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        if (action === 'toggle_admin') return { ...u, is_admin: !u.is_admin };
        if (action === 'suspend')
          return {
            ...u,
            banned_until: new Date(
              Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          };
        return { ...u, banned_until: null };
      }),
    );
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Permanently delete this user and all their data? This cannot be undone.',
    );
    if (!confirmed) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast({
        title: body.error ?? 'Something went wrong',
        variant: 'destructive',
      });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

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
            {isSuperAdmin && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr
                key={user.id}
                className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
              >
                <td className="px-4 py-3">
                  {user.display_name ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.email}
                  {user.banned_until && (
                    <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      suspended
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                  {fmtDate(user.created_at)}
                </td>
                <td className="px-4 py-3 tabular-nums">{user.session_count}</td>
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSelf}
                        title={
                          isSelf
                            ? 'You cannot modify your own account'
                            : undefined
                        }
                        onClick={() => handlePatch(user.id, 'toggle_admin')}
                      >
                        {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSelf}
                        title={
                          isSelf
                            ? 'You cannot modify your own account'
                            : undefined
                        }
                        onClick={() =>
                          handlePatch(
                            user.id,
                            user.banned_until ? 'unsuspend' : 'suspend',
                          )
                        }
                      >
                        {user.banned_until ? 'Unsuspend' : 'Suspend'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isSelf}
                        title={
                          isSelf
                            ? 'You cannot modify your own account'
                            : undefined
                        }
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
