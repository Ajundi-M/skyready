'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { normalizeInviteCode } from '@/lib/invite';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';

export async function signup(formData: FormData) {
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown';

  // 3 signup attempts per hour per IP
  const { allowed } = checkRateLimit(`signup:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    redirect('/signup?error=Too+many+signup+attempts.+Please+try+again+later.');
  }

  const supabase = await createClient();

  const displayName = formData.get('displayName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const inviteCode = normalizeInviteCode(formData.get('inviteCode') as string);

  // Step 1 — fast pre-flight check: does a claimable code exist?
  // This gives the user a friendly error before we attempt any auth work.
  // It is NOT the authoritative claim — that happens atomically in Step 3.
  const { data: codeRow } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('code', inviteCode)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!codeRow) {
    redirect('/signup?error=Invalid%2C+expired%2C+or+already+used+invite+code');
  }

  // Step 2 — create the Supabase Auth user.
  // We pass emailRedirectTo using the environment-configured site URL so that
  // the confirmation link works in all environments (local, staging, prod).
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (authError || !authData.user) {
    redirect('/signup?error=Could+not+create+account.+Please+try+again.');
  }

  // Intentionally NOT checking authData.user.identities?.length === 0 here.
  // That check leaks whether an email address is already registered.
  // Instead we always redirect to the confirmation page; Supabase will send
  // a "you already have an account" email to the existing user transparently.

  // Step 3 — atomically claim the invite code via a Postgres function that
  // does a single conditional UPDATE.  This eliminates the TOCTOU race that
  // existed between the pre-flight SELECT and the mark-used UPDATE.
  //
  // Service role is required because:
  //   a) claim_invite_code is a SECURITY DEFINER function that updates
  //      invite_codes on behalf of a user who is not yet authenticated
  //      (they've just been created and have no active session cookie yet).
  //   b) auth.admin.deleteUser() is only accessible via the service role key;
  //      it is not available through the anon/authenticated role.
  const serviceSupabase = createServiceClient();
  // The Supabase SDK's rpc() return type is `any` without generated database
  // types. rpc<T> constrains T to string (it's the function name key), so we
  // cast the result instead. `data` is boolean (the Postgres function returns
  // true on a successful claim), `error` is PostgrestError | null.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: claimRaw, error: claimError } = await serviceSupabase.rpc(
    'claim_invite_code',
    { p_code: inviteCode, p_user_id: authData.user.id },
  );
  const claimed = claimRaw as boolean | null;

  if (claimError || !claimed) {
    // Another concurrent signup won the race — roll back the new auth user.
    await serviceSupabase.auth.admin.deleteUser(authData.user.id);
    redirect(
      '/signup?error=Invite+code+was+just+used+by+someone+else.+Please+ask+for+a+new+one.',
    );
  }

  revalidatePath('/', 'layout');
  redirect(`/signup/confirm?email=${encodeURIComponent(email)}`);
}
