-- Migration: Add user_sessions table for End My Day cross-device sync
-- Run this in Supabase SQL Editor

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE,
  current_effective_date DATE NOT NULL,
  ended_at TIMESTAMP DEFAULT NOW()
);

-- Add index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Verify the table was created
SELECT * FROM user_sessions LIMIT 1;
