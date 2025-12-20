-- Progressly Upgrade: Phase 1 Database Schema
-- Run this in Supabase SQL Editor
-- Created: December 20, 2025

-- ============================================
-- TABLE 1: challenges
-- Stores challenge metadata and commitments
-- ============================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  -- Challenge commitments stored as JSONB
  -- Example: [{"id": "c1", "habit": "study", "target": 10, "unit": "hours", "frequency": "daily", "category": "Study"}]
  commitments JSONB NOT NULL DEFAULT '[]',
  
  -- Psychology-based fields
  identity_statement TEXT,
  why_statement TEXT,
  obstacle_prediction TEXT,
  success_threshold NUMERIC DEFAULT 70,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON public.challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);

-- ============================================
-- TABLE 2: daily_challenge_metrics
-- Tracks daily progress for each challenge
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_challenge_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  
  -- Status of each commitment for this day (JSONB)
  -- Example: {"c1": {"target": 10, "actual": 8.5, "unit": "hours", "completion_pct": 85, "status": "partial"}}
  commitments_status JSONB NOT NULL DEFAULT '{}',
  
  -- Aggregate metrics for the day
  overall_completion_pct NUMERIC DEFAULT 0,
  consistency_score NUMERIC DEFAULT 0,
  diligence_score NUMERIC DEFAULT 0,
  
  -- Cumulative metrics (up to this day)
  cumulative_consistency_rate NUMERIC DEFAULT 0,
  cumulative_diligence_rate NUMERIC DEFAULT 0,
  resilience_score INTEGER DEFAULT 0,
  
  -- Context
  day_of_week TEXT,
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible') OR mood IS NULL),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5 OR energy_level IS NULL),
  
  -- Recovery tracking
  is_recovery_day BOOLEAN DEFAULT false,
  days_since_last_miss INTEGER DEFAULT 0,
  consecutive_completion_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(challenge_id, date)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_metrics_challenge_id ON public.daily_challenge_metrics(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_challenge_metrics(date);

-- ============================================
-- TABLE 3: behavior_patterns
-- Stores detected behavioral patterns
-- ============================================
CREATE TABLE IF NOT EXISTS public.behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('weak_day', 'strong_day', 'strong_time', 'recovery_speed', 'failure_trigger')),
  
  -- Pattern data varies by type
  -- weak_day: {"day": "Friday", "avg_completion": 65, "sample_size": 8}
  -- strong_time: {"time_block": "9am-12pm", "avg_productivity": 92, "sample_size": 45}
  -- recovery_speed: {"avg_days_to_recover": 1.2, "fastest": 0, "slowest": 3}
  pattern_data JSONB NOT NULL,
  
  confidence_score NUMERIC DEFAULT 0,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patterns_challenge_id ON public.behavior_patterns(challenge_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON public.behavior_patterns(pattern_type);

-- ============================================
-- TABLE 4: activity_presets
-- Stores quick-tap activity presets
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  category_id INTEGER REFERENCES public.category(id),
  icon TEXT DEFAULT '📋',
  is_frequent BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- For smart suggestions
  typical_start_time TIME,
  typical_duration_minutes INTEGER,
  typical_days_of_week INTEGER[], -- [0,1,2,3,4,5,6] for Sun-Sat
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON public.activity_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_frequent ON public.activity_presets(is_frequent);

-- ============================================
-- MODIFY: loggedactivity table
-- Add challenge-related columns
-- ============================================
ALTER TABLE public.loggedactivity 
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commitment_id TEXT,
  ADD COLUMN IF NOT EXISTS is_auto_logged BOOLEAN DEFAULT false;

-- Index for challenge activities
CREATE INDEX IF NOT EXISTS idx_activities_challenge_id ON public.loggedactivity(challenge_id);

-- ============================================
-- FUNCTION: Update timestamp trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_challenges_updated_at ON public.challenges;
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON public.daily_challenge_metrics;
CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_challenge_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patterns_updated_at ON public.behavior_patterns;
CREATE TRIGGER update_patterns_updated_at
  BEFORE UPDATE ON public.behavior_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- Run these after creating tables to verify
-- ============================================

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('challenges', 'daily_challenge_metrics', 'behavior_patterns', 'activity_presets');

-- Check columns added to loggedactivity
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'loggedactivity' AND column_name IN ('challenge_id', 'commitment_id', 'is_auto_logged');
