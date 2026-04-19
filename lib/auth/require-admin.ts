import { createClient } from '@/lib/supabase/server';

/**
 * Resolves the authenticated user and asserts admin status for API route handlers.
 *
 * Returns `{ user, supabase }` on success, or a `Response` (401/403) on failure.
 * Callers should narrow with `instanceof Response` before destructuring:
 *
 * ```ts
 * const admin = await requireAdmin();
 * if (admin instanceof Response) return admin;
 * const { user, supabase } = admin;
 * ```
 *
 * Note: for Server Components that redirect (rather than returning JSON errors)
 * use the `redirect()` pattern directly — this helper is for API routes only.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { user, supabase };
}
