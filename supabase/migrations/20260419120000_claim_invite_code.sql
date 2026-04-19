-- Atomically claim an invite code for a given user.
--
-- The UPDATE only fires if the code exists, is unused, and has not expired.
-- Returns TRUE if the row was claimed, FALSE if it was already used / expired /
-- non-existent.  Using a single UPDATE + ROW_COUNT prevents the TOCTOU race
-- that exists when checking and updating in two separate statements.
--
-- SECURITY DEFINER lets the function bypass RLS so it can update invite_codes
-- regardless of the caller's role.  EXECUTE is granted to the authenticated
-- role so that server actions can call it via the anon/service-role client.

CREATE OR REPLACE FUNCTION public.claim_invite_code(
  p_code    text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated integer;
BEGIN
  UPDATE invite_codes
  SET
    used    = true,
    used_by = p_user_id,
    used_at = now()
  WHERE code       = p_code
    AND used       = false
    AND expires_at > now();

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;

-- Allow the service-role and authenticated callers to invoke this function.
GRANT EXECUTE ON FUNCTION public.claim_invite_code(text, uuid)
  TO service_role, authenticated;
