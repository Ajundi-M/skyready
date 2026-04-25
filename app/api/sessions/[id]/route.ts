import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  patchDTSessionSchema,
  patchSessionSchema,
} from '@/lib/schemas/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();

  if (fetchError || !existing || existing.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const vigilanceParsed = patchSessionSchema.safeParse(body);
  const dtParsed = !vigilanceParsed.success
    ? patchDTSessionSchema.safeParse(body)
    : null;

  if (!vigilanceParsed.success && !dtParsed?.success) {
    return Response.json(
      {
        error: 'Invalid payload',
        details: vigilanceParsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const parsedData = vigilanceParsed.success
    ? vigilanceParsed.data
    : dtParsed!.data!;

  const { completed_at, duration_s, score, accuracy, metrics } = parsedData;

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ completed_at, duration_s, score, accuracy, metrics })
    .eq('id', sessionId);

  if (updateError) {
    return Response.json(
      { error: 'Failed to update session' },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
