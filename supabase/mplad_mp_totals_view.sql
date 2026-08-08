-- FIX for "canceling statement due to statement timeout" on mplad_mp_totals.
--
-- The original plain VIEW re-ran the full SUM/GROUP BY over
-- mplads_recommended (~89k rows) and mplads_expenditure (~66k rows) on
-- every single read, with no supporting indexes — slow enough to hit
-- Supabase's statement timeout. A MATERIALIZED VIEW computes this once and
-- stores the result, so reads are instant; you just refresh it after your
-- MPLAD scraper pipeline runs.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

-- 1) Indexes so the (one-time) aggregation itself is fast.
CREATE INDEX IF NOT EXISTS idx_mplads_recommended_mp_id ON mplads_recommended (mp_id);
CREATE INDEX IF NOT EXISTS idx_mplads_recommended_house ON mplads_recommended (house);
CREATE INDEX IF NOT EXISTS idx_mplads_expenditure_mp_id ON mplads_expenditure (mp_id);
CREATE INDEX IF NOT EXISTS idx_mplads_expenditure_house ON mplads_expenditure (house);

-- 2) Drop the old (slow) plain view if it exists.
DROP VIEW IF EXISTS mplad_mp_totals;
DROP MATERIALIZED VIEW IF EXISTS mplad_mp_totals;

-- 3) Materialized view: same logic, computed once and cached.
CREATE MATERIALIZED VIEW mplad_mp_totals AS
SELECT
  mps.id AS mp_id,
  COALESCE(r.total_recommended, 0) AS total_sanctioned_rupees,
  COALESCE(e.total_expenditure, 0) AS total_utilised_rupees,
  CASE
    WHEN COALESCE(r.total_recommended, 0) > 0
      THEN ROUND((COALESCE(e.total_expenditure, 0) / r.total_recommended) * 100, 1)
    ELSE 0
  END AS utilization_pct
FROM mps
LEFT JOIN (
  SELECT mp_id, SUM(recommended_amount_rupees) AS total_recommended
  FROM mplads_recommended
  WHERE house = 'Lok Sabha'
  GROUP BY mp_id
) r ON r.mp_id = mps.id
LEFT JOIN (
  SELECT mp_id, SUM(expenditure_amount_rupees) AS total_expenditure
  FROM mplads_expenditure
  WHERE house = 'Lok Sabha'
  GROUP BY mp_id
) e ON e.mp_id = mps.id
WITH DATA;

-- 4) A unique index on mp_id is required for REFRESH ... CONCURRENTLY below
--    (lets you refresh without locking out readers).
CREATE UNIQUE INDEX IF NOT EXISTS idx_mplad_mp_totals_mp_id ON mplad_mp_totals (mp_id);

GRANT SELECT ON mplad_mp_totals TO anon, authenticated;

-- ---------------------------------------------------------------------
-- IMPORTANT: materialized views do NOT auto-update when the underlying
-- mplads_recommended / mplads_expenditure tables change. Re-run this
-- after each scrape/import, ideally as the last step of that pipeline:
--
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mplad_mp_totals;
--
-- If you want this fully automatic and your Supabase project has the
-- pg_cron extension enabled, you can schedule it, e.g. nightly at 3am UTC:
--
--   SELECT cron.schedule(
--     'refresh_mplad_mp_totals',
--     '0 3 * * *',
--     $$REFRESH MATERIALIZED VIEW CONCURRENTLY mplad_mp_totals$$
--   );
-- ---------------------------------------------------------------------
