import { createClient } from '@/lib/supabase/server';
import { checkCsrfOrigin } from '@/lib/security/csrf';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!checkCsrfOrigin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  const { error } = await supabase
    .from('invite_codes')
    .delete()
    .eq('code', code);

  if (error) {
    return Response.json({ error: 'Failed to delete invite' }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
