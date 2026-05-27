-- Fix deadline fields to handle opportunities with no explicit deadline
-- and to store the full datetime with timezone for accurate display

-- 1. Make deadline_date nullable (some opportunities don't have a deadline)
ALTER TABLE active_projects ALTER COLUMN deadline_date DROP NOT NULL;

-- 2. Add deadline_time column to store the full ISO 8601 datetime with timezone
-- e.g. "2026-06-26T16:30:00-04:00" for exact response deadline time
ALTER TABLE active_projects ADD COLUMN IF NOT EXISTS deadline_time text;

-- 3. Add posted_date column to track when the opportunity was posted (separate from deadline)
ALTER TABLE active_projects ADD COLUMN IF NOT EXISTS posted_date date;
