-- Gym app core schema

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_group text NOT NULL,
  type text NOT NULL DEFAULT 'weight_reps' CHECK (type IN ('weight_reps', 'bodyweight')),
  is_custom boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.templates (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises (id) ON DELETE RESTRICT,
  position integer NOT NULL,
  target_sets integer NOT NULL CHECK (target_sets >= 1),
  superset_group smallint,
  UNIQUE (template_id, position)
);

CREATE TABLE public.workouts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates (id) ON DELETE SET NULL,
  name text NOT NULL,
  performed_on date NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status = 'completed'),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises (id) ON DELETE RESTRICT,
  position integer NOT NULL,
  superset_group smallint,
  is_adhoc boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  workout_exercise_id uuid NOT NULL REFERENCES public.workout_exercises (id) ON DELETE CASCADE,
  set_index integer NOT NULL CHECK (set_index >= 1),
  weight numeric(8, 2),
  reps integer NOT NULL CHECK (reps >= 0),
  is_warmup boolean NOT NULL DEFAULT false,
  to_failure boolean NOT NULL DEFAULT false,
  CHECK (weight IS NULL OR weight >= 0),
  UNIQUE (workout_exercise_id, set_index)
);

CREATE INDEX exercises_user_id_is_archived_idx ON public.exercises (user_id, is_archived);
CREATE INDEX template_exercises_template_id_idx ON public.template_exercises (template_id);
CREATE INDEX workouts_user_id_performed_on_idx ON public.workouts (user_id, performed_on DESC);
CREATE INDEX workout_exercises_workout_id_idx ON public.workout_exercises (workout_id);
CREATE INDEX sets_workout_exercise_id_idx ON public.sets (workout_exercise_id);
