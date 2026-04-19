import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateInviteCode, inviteExpiry } from '@/lib/invite';
import { checkCsrfOrigin } from '@/lib/security/csrf';

async function getAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, forbidden: true };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return { supabase, user, forbidden: !profile?.is_admin };
}

export async function GET() {
  const { user, forbidden } = await getAdminUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (forbidden) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date().toISOString();

  // Service role is required here to bypass RLS and retrieve all invite codes
  // (not just those created by the requesting admin) together with the
  // profiles!used_by join, which crosses the RLS boundary on the profiles table.
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('invite_codes')
    .select('*, profiles!used_by(email)')
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }

  const invites = (data ?? []).map((row) => ({
    ...row,
    status: row.used ? 'used' : row.expires_at < now ? 'expired' : 'unused',
  }));

  return Response.json(invites);
}

export async function POST(request: Request) {
  if (!checkCsrfOrigin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { supabase, user, forbidden } = await getAdminUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (forbidden) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const code = generateInviteCode();
  const expires_at = inviteExpiry().toISOString();

  const { error } = await supabase
    .from('invite_codes')
    .insert({ code, created_by: user.id, expires_at });

  if (error) {
    return Response.json({ error: 'Failed to create invite' }, { status: 500 });
  }

  return Response.json({ code }, { status: 201 });
}
