-- Migration: Privacy-safe analytics enhancements
-- Adds index for retention cleanup and documents 90-day retention policy

-- Index for efficient retention cleanup (DELETE WHERE created_at < ...)
CREATE INDEX IF NOT EXISTS idx_impact_events_created_at ON impact_events (created_at);

-- Optional: Add comment documenting retention policy
COMMENT ON TABLE impact_events IS
'Anonymous event counters for impact measurement.
Retention: Raw events auto-deleted after 90 days (manual or pg_cron).
Aggregated counts (via /api/impact-summary) kept indefinitely.
No PII stored: sessionId stripped at ingest, only hour_bucket timestamp retained.';

-- Optional: Partition by month for easier retention (uncomment if using pg_partman or manual partitioning)
-- CREATE TABLE IF NOT EXISTS impact_events_partitioned (LIKE impact_events INCLUDING ALL) PARTITION BY RANGE (created_at);