import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const dtStimulusSchema = z.enum([
  'red',
  'blue',
  'yellow',
  'green',
  'foot_left',
  'foot_right',
  'tone_left',
  'tone_right',
]);

const schema = z.object({
  preferences: z.object({
    dt_keys: z.record(dtStimulusSchema, z.string().min(1).max(10)).optional(),
    dt_last_variant: z.enum(['visual', 'visual_oral']).optional(),
    dt_last_mode: z.enum(['action', 'reaction', 'adaptive']).optional(),
  }),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 },
    );
  }

  // Always merge — never replace — to preserve any unrelated preference keys.
  const existing =
    (profile?.preferences as Record<string, unknown> | null) ?? {};
  const merged = { ...existing, ...parsed.data.preferences };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ preferences: merged })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 },
    );
  }

  return NextResponse.json({ preferences: merged }, { status: 200 });
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();
  return NextResponse.json({
    preferences: (profile?.preferences as Record<string, unknown>) ?? {},
  });
}
