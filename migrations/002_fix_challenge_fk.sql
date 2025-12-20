-- Fix: Remove foreign key constraint on challenges.user_id to match other tables (Goal, Category, etc.)
-- This resolves the "violates foreign key constraint challenges_user_id_fkey" error.

ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_user_id_fkey;

-- Also fix activity_presets which might face the same issue
ALTER TABLE public.activity_presets DROP CONSTRAINT IF EXISTS activity_presets_user_id_fkey;
