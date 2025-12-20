-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  activity_name text NOT NULL,
  category_id integer,
  icon text DEFAULT '📋'::text,
  is_frequent boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  typical_start_time time without time zone,
  typical_duration_minutes integer,
  typical_days_of_week ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_presets_pkey PRIMARY KEY (id),
  CONSTRAINT activity_presets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id)
);
CREATE TABLE public.alembic_version (
  version_num character varying NOT NULL,
  CONSTRAINT alembic_version_pkey PRIMARY KEY (version_num)
);
CREATE TABLE public.behavior_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type = ANY (ARRAY['weak_day'::text, 'strong_day'::text, 'strong_time'::text, 'recovery_speed'::text, 'failure_trigger'::text])),
  pattern_data jsonb NOT NULL,
  confidence_score numeric DEFAULT 0,
  discovered_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT behavior_patterns_pkey PRIMARY KEY (id),
  CONSTRAINT behavior_patterns_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.category (
  id integer NOT NULL DEFAULT nextval('category_id_seq'::regclass),
  name character varying NOT NULL,
  user_id character varying NOT NULL,
  color character varying NOT NULL,
  CONSTRAINT category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_days integer NOT NULL,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text])),
  commitments jsonb NOT NULL DEFAULT '[]'::jsonb,
  identity_statement text,
  why_statement text,
  obstacle_prediction text,
  success_threshold numeric DEFAULT 70,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp without time zone NOT NULL,
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_challenge_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL,
  date date NOT NULL,
  day_number integer NOT NULL,
  commitments_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_completion_pct numeric DEFAULT 0,
  consistency_score numeric DEFAULT 0,
  diligence_score numeric DEFAULT 0,
  cumulative_consistency_rate numeric DEFAULT 0,
  cumulative_diligence_rate numeric DEFAULT 0,
  resilience_score integer DEFAULT 0,
  day_of_week text,
  notes text,
  mood text CHECK ((mood = ANY (ARRAY['great'::text, 'good'::text, 'okay'::text, 'bad'::text, 'terrible'::text])) OR mood IS NULL),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5 OR energy_level IS NULL),
  is_recovery_day boolean DEFAULT false,
  days_since_last_miss integer DEFAULT 0,
  consecutive_completion_streak integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_challenge_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT daily_challenge_metrics_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.dailytarget (
  id integer NOT NULL DEFAULT nextval('dailytarget_id_seq'::regclass),
  user_id character varying NOT NULL,
  category_name character varying NOT NULL,
  target_hours double precision NOT NULL,
  CONSTRAINT dailytarget_pkey PRIMARY KEY (id)
);
CREATE TABLE public.goal (
  id integer NOT NULL DEFAULT nextval('goal_id_seq'::regclass),
  content character varying NOT NULL,
  user_id character varying NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT goal_pkey PRIMARY KEY (id)
);
CREATE TABLE public.loggedactivity (
  id integer NOT NULL DEFAULT nextval('loggedactivity_id_seq'::regclass),
  activity_name character varying NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  user_id character varying NOT NULL,
  activity_date timestamp without time zone NOT NULL DEFAULT now(),
  category_id integer,
  effective_date date,
  challenge_id uuid,
  commitment_id text,
  is_auto_logged boolean DEFAULT false,
  CONSTRAINT loggedactivity_pkey PRIMARY KEY (id),
  CONSTRAINT loggedactivity_category_id_fkey1 FOREIGN KEY (category_id) REFERENCES public.category(id),
  CONSTRAINT loggedactivity_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying NOT NULL,
  content character varying NOT NULL,
  created_at timestamp without time zone NOT NULL,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.user_sessions (
  id integer NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
  user_id character varying NOT NULL UNIQUE,
  current_effective_date date NOT NULL,
  ended_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  avatar_url character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);