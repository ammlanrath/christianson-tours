-- Supabase Migration: Schedule Expired Booking Release

-- Create the pg_cron extension if not exists (Requires superuser / Supabase dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every 5 minutes
-- This ensures that any bookings stuck in PENDING for > 30 minutes are purged 
-- and capacity is accurately restored.
SELECT cron.schedule(
  'release-expired-bookings-job',
  '*/5 * * * *',
  $$
    SELECT public.release_expired_bookings();
  $$
);
