'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const displayName = formData.get('displayName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const inviteCode = (formData.get('inviteCode') as string)
    .toUpperCase()
    .trim();

  // Step 1 — validate the invite code BEFORE creating the user
  const { data: codeRow, error: codeError } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('code', inviteCode)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (codeError || !codeRow) {
    redirect('/signup?error=Invalid, expired, or already used invite code');
  }

  // Step 2 — create the Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (authError || !authData.user) {
    redirect('/signup?error=Could not create account. Please try again.');
  }

  // Step 3 — mark the invite code as used
  await supabase
    .from('invite_codes')
    .update({
      used: true,
      used_by: authData.user.id,
      used_at: new Date().toISOString(),
    })
    .eq('code', inviteCode);

  revalidatePath('/', 'layout');
  redirect(`/signup/confirm?email=${encodeURIComponent(email)}`);
}
