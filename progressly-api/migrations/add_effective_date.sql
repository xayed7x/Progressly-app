-- Migration: Add effective_date column to loggedactivity table
-- Run this in Supabase SQL Editor

-- Step 1: Add the effective_date column (nullable initially)
ALTER TABLE loggedactivity ADD COLUMN IF NOT EXISTS effective_date DATE;

-- Step 2: Backfill existing activities with effective_date = activity_date::date
-- This sets the psychological day to the calendar date for existing records
UPDATE loggedactivity 
SET effective_date = activity_date::date 
WHERE effective_date IS NULL;

-- Step 3: Add index for fast lookups by effective_date
CREATE INDEX IF NOT EXISTS idx_loggedactivity_effective_date 
ON loggedactivity(user_id, effective_date);

-- Verify the migration
SELECT 
    COUNT(*) as total_activities,
    COUNT(effective_date) as with_effective_date,
    COUNT(*) - COUNT(effective_date) as missing_effective_date
FROM loggedactivity;
