import { createClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client authenticated with the service role key.
 *
 * The service role key bypasses ALL Row Level Security policies. Only use this
 * client when the anon/authenticated role is provably insufficient, and select
 * the minimum columns/rows required for the operation. Current callers:
 *
 *   1. GET /api/admin/invites — reads invite_codes with a profiles join across
 *      the RLS boundary (all invites, not just those owned by the caller).
 *
 *   2. signup action — calls claim_invite_code (SECURITY DEFINER RPC) and
 *      auth.admin.deleteUser(), both of which require the service role.
 *
 * Never expose this client or its results to untrusted callers.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
