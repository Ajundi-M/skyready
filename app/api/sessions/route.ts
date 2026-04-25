import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { module?: string } = {};
  try {
    const parsed: unknown = await request.json();
    if (parsed && typeof parsed === 'object' && 'module' in parsed) {
      const moduleValue = (parsed as { module?: unknown }).module;
      if (typeof moduleValue === 'string') {
        body = { module: moduleValue };
      }
    }
  } catch {}

  const allowedModules = ['vigilance', 'determination'] as const;
  type AllowedModule = (typeof allowedModules)[number];
  const sessionModule: AllowedModule = allowedModules.includes(
    body.module as AllowedModule,
  )
    ? (body.module as AllowedModule)
    : 'vigilance';

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      module: sessionModule,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .returns<{ id: string }[]>()
    .single();

  if (error || !data) {
    return Response.json(
      { error: 'Failed to create session' },
      { status: 500 },
    );
  }

  return Response.json({ id: data.id });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const moduleFilter = request.nextUrl.searchParams.get('module');

  let query = supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(20);

  if (moduleFilter) {
    query = query.eq('module', moduleFilter);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }

  return Response.json(data);
}
