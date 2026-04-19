'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function login(formData: FormData) {
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown';

  // 5 attempts per 5 minutes per IP
  const { allowed } = checkRateLimit(`login:${ip}`, 5, 5 * 60 * 1000);
  if (!allowed) {
    redirect('/login?error=Too+many+attempts.+Please+wait+a+few+minutes.');
  }

  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/login?error=Invalid email or password');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
