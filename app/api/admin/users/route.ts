import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/service';

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  sessions: [{ count: number }] | [];
};

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  // SERVICE ROLE: Bypasses RLS to return all profiles, not just the
  // calling admin's own row. Admin identity verified above via requireAdmin().
  const serviceSupabase = createServiceClient();
  const { data, error } = await serviceSupabase
    .from('profiles')
    .select('id, email, display_name, created_at, sessions(count)')
    .order('created_at', { ascending: false })
    .returns<ProfileRow[]>();

  if (error) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  const users = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    created_at: row.created_at,
    session_count: (row.sessions as [{ count: number }])[0]?.count ?? 0,
  }));

  return Response.json(users);
}
