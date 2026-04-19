import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { supabase } = admin;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, created_at, sessions(count)')
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  const users = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    created_at: row.created_at,
    session_count:
      (row.sessions as unknown as [{ count: number }])[0]?.count ?? 0,
  }));

  return Response.json(users);
}
