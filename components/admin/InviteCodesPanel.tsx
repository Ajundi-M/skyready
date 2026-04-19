'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type InviteCode = {
  code: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  status: 'unused' | 'used' | 'expired';
  profiles: { email: string } | null;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const statusStyles: Record<InviteCode['status'], string> = {
  unused:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  used: 'bg-muted text-muted-foreground',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function InviteCodesPanel() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/invites', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json() as Promise<InviteCode[]>;
      })
      .then((data) => setCodes(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/invites', { method: 'POST' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const { code } = (await res.json()) as { code: string };

      const fresh: InviteCode = {
        code,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        used: false,
        status: 'unused',
        profiles: null,
      };

      setCodes((prev) => [fresh, ...prev]);
      setNewCode(code);
      setCopied(false);
      toast({
        title: 'Invite code created',
        description: `Expires in 48 hours.`,
      });
    } catch {
      toast({
        title: 'Failed to generate invite code',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(code: string) {
    setDeleteErrors((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });

    const res = await fetch(`/api/admin/invites/${code}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const message = body.error ?? `Error ${res.status}`;
      setDeleteErrors((prev) => ({ ...prev, [code]: message }));
      toast({
        title: 'Failed to delete invite',
        description: message,
        variant: 'destructive',
      });
      return;
    }
    setCodes((prev) => prev.filter((c) => c.code !== code));
    toast({ title: 'Invite code deleted' });
  }

  async function handleCopy() {
    if (!newCode) return;
    await navigator.clipboard.writeText(newCode);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {codes.length} code{codes.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate Code'}
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : fetchError ? (
        <p className="py-8 text-center text-sm text-destructive">
          {fetchError}
        </p>
      ) : codes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No invite codes yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Used By</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((invite, i) => (
                <tr
                  key={invite.code}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                >
                  <td className="px-4 py-3 font-mono tracking-wide">
                    {invite.code}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                    {fmtDate(invite.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                    {fmtDate(invite.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusStyles[invite.status],
                      )}
                    >
                      {invite.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {invite.profiles?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {invite.status === 'unused' && (
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => handleDelete(invite.code)}
                        >
                          Delete
                        </Button>
                      )}
                      {deleteErrors[invite.code] && (
                        <p className="text-xs text-destructive">
                          {deleteErrors[invite.code]}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New-code modal */}
      {newCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (
              dialogRef.current &&
              !dialogRef.current.contains(e.target as Node)
            ) {
              setNewCode(null);
            }
          }}
        >
          <div
            ref={dialogRef}
            className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-background p-6 shadow-lg"
          >
            <h3 className="text-base font-semibold">New Invite Code</h3>
            <p className="text-sm text-muted-foreground">
              Share this code with the invitee. It expires in 48 hours.
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
              <span className="flex-1 font-mono text-sm tracking-wide">
                {newCode}
              </span>
              <Button size="xs" variant="outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-end"
              onClick={() => setNewCode(null)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
