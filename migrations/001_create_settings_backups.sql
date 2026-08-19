-- Migration: create settings_backups table
-- Run this on your Supabase / Postgres instance to enable server-side restore points.

CREATE TABLE IF NOT EXISTS public.settings_backups (
  id BIGSERIAL PRIMARY KEY,
  settings JSONB NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: Grant select/insert privileges to the anon/public role if you need API access
-- GRANT SELECT, INSERT ON public.settings_backups TO anon;