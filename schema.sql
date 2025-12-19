-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alembic_version (
  version_num character varying NOT NULL,
  CONSTRAINT alembic_version_pkey PRIMARY KEY (version_num)
);
CREATE TABLE public.category (
  id integer NOT NULL DEFAULT nextval('category_id_seq'::regclass),
  name character varying NOT NULL,
  user_id character varying NOT NULL,
  color character varying NOT NULL,
  CONSTRAINT category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp without time zone NOT NULL,
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
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
  CONSTRAINT loggedactivity_pkey PRIMARY KEY (id),
  CONSTRAINT loggedactivity_category_id_fkey1 FOREIGN KEY (category_id) REFERENCES public.category(id)
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