import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { completed_at, duration_s, score, accuracy, metrics } =
    await request.json();

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
