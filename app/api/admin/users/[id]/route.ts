import { z } from 'zod';
import { checkCsrfOrigin } from '@/lib/security/csrf';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/service';

const patchSchema = z.object({
  action: z.enum(['toggle_admin', 'suspend', 'unsuspend']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkCsrfOrigin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { user } = admin;

  const { id } = await params;

  const body: unknown = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { action } = parsed.data;

  // SERVICE ROLE: auth.admin.updateUser() and profile writes across RLS boundaries
  // are only permitted with the service role key.
  const serviceSupabase = createServiceClient();

  if (action === 'toggle_admin') {
    if (id === user.id) {
      return Response.json(
        { error: 'You cannot change your own admin status' },
        { status: 400 },
      );
    }

    const { data: profile, error: fetchError } = await serviceSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', id)
      .single();

    if (fetchError || !profile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { error } = await serviceSupabase
      .from('profiles')
      .update({ is_admin: !profile.is_admin })
      .eq('id', id);

    if (error) {
      return Response.json(
        { error: 'Failed to update admin status' },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  }

  if (action === 'suspend') {
    if (id === user.id) {
      return Response.json(
        { error: 'You cannot suspend yourself' },
        { status: 400 },
      );
    }

    // SERVICE ROLE: auth.admin.updateUserById() is only available to the service role
    const { error } = await serviceSupabase.auth.admin.updateUserById(id, {
      ban_duration: '876600h',
    });

    if (error) {
      return Response.json(
        { error: 'Failed to suspend user' },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  }

  // action === 'unsuspend'
  // SERVICE ROLE: auth.admin.updateUserById() is only available to the service role
  const { error } = await serviceSupabase.auth.admin.updateUserById(id, {
    ban_duration: 'none',
  });

  if (error) {
    return Response.json(
      { error: 'Failed to unsuspend user' },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkCsrfOrigin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { user } = admin;

  const { id } = await params;

  if (id === user.id) {
    return Response.json(
      { error: 'You cannot delete yourself' },
      { status: 400 },
    );
  }

  // SERVICE ROLE: Deleting rows in sessions and profiles, and calling
  // auth.admin.deleteUser(), all require the service role to bypass RLS
  // and access the auth schema.
  const serviceSupabase = createServiceClient();

  // 1. Remove all sessions for the user — RLS prevents deletion of other
  //    users' rows, so service role is required.
  const { error: sessionsError } = await serviceSupabase
    .from('sessions')
    .delete()
    .eq('user_id', id);

  if (sessionsError) {
    return Response.json(
      { error: 'Failed to delete user sessions' },
      { status: 500 },
    );
  }

  // 2. Remove the user's profile row — RLS prevents deletion of other
  //    users' rows, so service role is required.
  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (profileError) {
    return Response.json(
      { error: 'Failed to delete user profile' },
      { status: 500 },
    );
  }

  // 3. Delete the auth user — auth.admin.deleteUser() is only available
  //    to the service role.
  const { error: authError } = await serviceSupabase.auth.admin.deleteUser(id);

  if (authError) {
    return Response.json(
      { error: 'Failed to delete auth user' },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
