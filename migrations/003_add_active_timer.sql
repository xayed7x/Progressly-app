-- Migration: Add active_timer column to user_sessions for cross-device timer sync
-- Run this in Supabase SQL Editor

-- Add active_timer column (JSONB)
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS active_timer JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN user_sessions.active_timer IS 'JSON: { category_id, category_name, start_time } for QuickTap timer sync';

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_sessions';
