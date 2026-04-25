-- Migration: add user preferences column to profiles
--
-- Existing rows receive '{}' automatically (Postgres 11+: no table rewrite).
-- RLS: no change needed — column inherits the existing row-level policy
-- (users can SELECT and UPDATE their own row only).
--
-- IMPORTANT: Always MERGE into this column, never replace the whole value.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN profiles.preferences IS
  'Application preference store. Shape is application-defined. '
  'Never store auth credentials here. '
  'Always merge incoming values — never overwrite the full column.';
