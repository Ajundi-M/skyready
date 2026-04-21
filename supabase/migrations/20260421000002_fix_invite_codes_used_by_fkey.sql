ALTER TABLE public.invite_codes
  DROP CONSTRAINT IF EXISTS invite_codes_used_by_fkey;

ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_used_by_fkey
  FOREIGN KEY (used_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
