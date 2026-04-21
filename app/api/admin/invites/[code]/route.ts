import { checkCsrfOrigin } from '@/lib/security/csrf';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/service';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!checkCsrfOrigin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { supabase } = admin;

  const { code } = await params;

  const { data: invite, error: fetchError } = await supabase
    .from('invite_codes')
    .select('used')
    .eq('code', code)
    .single();

  if (fetchError || !invite) {
    return Response.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.used) {
    return Response.json(
      { error: 'Cannot delete a used invite' },
      { status: 400 },
    );
  }

  // SERVICE ROLE: Bypasses RLS to allow admins to delete expired unused
  // codes. Admin identity is already verified above via requireAdmin().
  // Only deletes the specific code requested — no over-fetching.
  const serviceSupabase = createServiceClient();
  const { error } = await serviceSupabase
    .from('invite_codes')
    .delete()
    .eq('code', code)
    .eq('used', false);

  if (error) {
    return Response.json({ error: 'Failed to delete invite' }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
