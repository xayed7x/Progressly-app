export type Activity = {
  id: string;
  activity_name: string;
  start_time: string;
  end_time: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  activity_date: string;
  effective_date: string | null;  // Psychological day (wake-up to wake-up)
};

export type Category = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  color: string;
};

export type ActivityReadWithCategory = Activity & {
  category: Category | null;
};

export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  status?: 'pending' | 'sent';
};

export type DailySummaryItem = {
  category_id: number;
  category_name: string;
  category_color: string;
  total_duration_minutes: number;
};

export interface PieChartData {
  id: number;
  name: string;
  duration: number;
  color: string;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface DashboardBootstrapData {
  // Note: Despite the name, this field now contains ALL activities (unlimited retention)
  // The name is kept for backward compatibility
  activities_last_3_days: ActivityReadWithCategory[];
  pie_chart_data: PieChartData[];
  last_end_time: string | null;
  categories: Category[];
  effective_date: string;  // ISO date string for the user's current "day" based on wake-up logic
}

export interface DailyTarget {
  id: number;
  user_id: string;
  category_name: string;
  target_hours: number;
}

// ============================================
// CHALLENGE SYSTEM TYPES
// ============================================

export type CommitmentFrequency = 'daily' | 'weekly';
export type CommitmentUnit = 'hours' | 'minutes' | null;
export type ChallengeStatus = 'active' | 'completed' | 'abandoned';
export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';
export type PatternType = 'weak_day' | 'strong_day' | 'strong_time' | 'recovery_speed' | 'failure_trigger';
export type CommitmentStatusType = 'not_started' | 'in_progress' | 'complete' | 'partial' | 'not_applicable';

/**
 * A single commitment within a challenge
 * Stored in challenges.commitments JSONB array
 */
export interface Commitment {
  id: string;
  habit: string;
  target: number | 'complete';  // number for hours-based, 'complete' for yes/no
  unit: CommitmentUnit;
  frequency: CommitmentFrequency;
  daysOfWeek?: number[];  // [0,1,2,3,4,5,6] for Sun-Sat, only for weekly
  category: string;
  categoryId?: number;
}

/**
 * Full challenge object as stored in database
 */
export interface Challenge {
  id: string;
  user_id: string;
  name: string;
  start_date: string;  // ISO date string
  end_date: string;    // ISO date string
  duration_days: number;
  status: ChallengeStatus;
  commitments: Commitment[];
  identity_statement: string | null;
  why_statement: string | null;
  obstacle_prediction: string | null;
  success_threshold: number;
  created_at: string;
  updated_at: string;
}

/**
 * Status of a single commitment for a specific day
 * Stored in daily_challenge_metrics.commitments_status JSONB
 */
export interface CommitmentDayStatus {
  target: number | 'complete';
  actual: number | 'yes' | 'no' | 'not_scheduled';
  unit: CommitmentUnit;
  completion_pct: number | null;
  status: CommitmentStatusType;
}

/**
 * Daily challenge metrics record
 */
export interface DailyChallengeMetrics {
  id: string;
  challenge_id: string;
  date: string;  // ISO date string
  day_number: number;
  commitments_status: Record<string, CommitmentDayStatus>;
  overall_completion_pct: number;
  consistency_score: number;
  diligence_score: number;
  cumulative_consistency_rate: number;
  cumulative_diligence_rate: number;
  resilience_score: number;
  day_of_week: string | null;
  notes: string | null;
  mood: MoodType | null;
  energy_level: number | null;  // 1-5
  is_recovery_day: boolean;
  days_since_last_miss: number;
  consecutive_completion_streak: number;
  created_at: string;
  updated_at: string;
}

/**
 * Pattern data varies by type
 */
export interface WeakDayPatternData {
  day: string;
  avg_completion: number;
  sample_size: number;
}

export interface StrongTimePatternData {
  time_block: string;
  avg_duration: number;
  session_count: number;
  productivity_score: number;
}

export interface RecoverySpeedPatternData {
  avg_days_to_recover: number;
  fastest: number;
  slowest: number;
  recovery_count: number;
}

export interface FailureTriggerPatternData {
  trigger_type: string;
  value: string;
  occurrence_count: number;
  total_low_days: number;
}

export type PatternData = 
  | WeakDayPatternData 
  | StrongTimePatternData 
  | RecoverySpeedPatternData 
  | FailureTriggerPatternData;

/**
 * Behavior pattern detected by the system
 */
export interface BehaviorPattern {
  id: string;
  challenge_id: string;
  pattern_type: PatternType;
  pattern_data: PatternData;
  confidence_score: number;
  discovered_at: string;
  last_updated: string;
}

/**
 * Quick-tap activity preset
 */
export interface ActivityPreset {
  id: string;
  user_id: string;
  activity_name: string;
  category_id: number | null;
  icon: string;
  is_frequent: boolean;
  usage_count: number;
  last_used_at: string | null;
  typical_start_time: string | null;
  typical_duration_minutes: number | null;
  typical_days_of_week: number[] | null;
  created_at: string;
}

/**
 * Extended Activity type with challenge fields
 */
export type ActivityWithChallenge = Activity & {
  challenge_id: string | null;
  commitment_id: string | null;
  is_auto_logged: boolean;
};

/**
 * Input type for creating a new challenge
 */
export interface CreateChallengeInput {
  name: string;
  start_date: string;
  duration_days: number;
  commitments: Commitment[];
  identity_statement?: string;
  why_statement?: string;
  obstacle_prediction?: string;
  success_threshold?: number;
}

/**
 * Progress data for a single commitment (calculated)
 */
export interface CommitmentProgress {
  commitmentId: string;
  target: number | 'complete';
  actual: number;
  percentage: number;
  status: CommitmentStatusType;
}