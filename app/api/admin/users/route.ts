import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

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
