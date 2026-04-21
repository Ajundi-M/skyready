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
  is_super_admin: boolean;
  banned_until: string | null;
};

type Props = {
  currentUserId: string;
  isSuperAdmin: boolean;
};

export function AdminsTable({ currentUserId, isSuperAdmin }: Props) {
  const [admins, setAdmins] = useState<User[]>([]);
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
      .then((data) =>
        setAdmins(data.filter((u) => u.is_admin && u.id !== currentUserId)),
      )
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  async function handleRevokeAdmin(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_admin' }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast({
        title: body.error ?? 'Something went wrong',
        variant: 'destructive',
      });
      return;
    }

    setAdmins((prev) => prev.filter((u) => u.id !== id));
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

  if (admins.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No other admins.
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
            {isSuperAdmin && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {admins.map((user, i) => {
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
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                  {fmtDate(user.created_at)}
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSelf}
                      title={
                        isSelf
                          ? 'You cannot modify your own account'
                          : undefined
                      }
                      onClick={() => handleRevokeAdmin(user.id)}
                    >
                      Revoke Admin
                    </Button>
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
