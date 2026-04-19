-- Cleanup: remove sessions that were started but never completed.
--
-- A session is considered abandoned if:
--   - completed_at IS NULL  (the PATCH endpoint was never called)
--   - started_at  < now() - interval '1 hour'
--
-- The cancelled-session fix in Phase 3.5 should prevent most new orphans, but
-- this cleanup handles any that slip through (browser crash, network loss, etc.)
--
-- ─────────────────────────────────────────────────────────────────────────────
-- OPTION A — pg_cron (preferred, requires the pg_cron extension)
--
-- Enable in Supabase: Dashboard → Database → Extensions → pg_cron
--
-- select cron.schedule(
--   'cleanup-abandoned-sessions',
--   '0 * * * *',   -- every hour, on the hour
--   $$
--     delete from sessions
--      where completed_at is null
--        and started_at < now() - interval '1 hour';
--   $$
-- );
--
-- To verify the schedule is registered:
--   select * from cron.job where jobname = 'cleanup-abandoned-sessions';
--
-- To remove the schedule:
--   select cron.unschedule('cleanup-abandoned-sessions');
--
-- ─────────────────────────────────────────────────────────────────────────────
-- OPTION B — manual one-shot query (no extension required)
--
-- Run this in the Supabase SQL editor or via an external cron (e.g. GitHub
-- Actions on a schedule, a Vercel cron job, etc.) as often as you like:
--

delete from sessions
 where completed_at is null
   and started_at < now() - interval '1 hour';

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: This migration executes the DELETE immediately on first apply.
-- Subsequent runs will find nothing to delete. If you prefer not to run the
-- delete on migrate, wrap it in a DO block with a comment or simply comment
-- out the statement above and use pg_cron (Option A) exclusively.
