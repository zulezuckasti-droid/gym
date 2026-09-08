CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.finish_workout(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_workout jsonb := payload -> 'workout';
  v_workout_id uuid := (v_workout ->> 'id')::uuid;
  v_exercise jsonb;
  v_set jsonb;
  v_we_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_workout IS NULL OR v_workout_id IS NULL THEN
    RAISE EXCEPTION 'Invalid payload: workout.id is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = v_workout_id AND w.user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('workout_id', v_workout_id, 'status', 'already_synced');
  END IF;

  INSERT INTO public.workouts (
    id, user_id, template_id, name, performed_on,
    started_at, finished_at, status, notes
  ) VALUES (
    v_workout_id,
    v_user_id,
    NULLIF(v_workout ->> 'template_id', '')::uuid,
    v_workout ->> 'name',
    (v_workout ->> 'performed_on')::date,
    (v_workout ->> 'started_at')::timestamptz,
    (v_workout ->> 'finished_at')::timestamptz,
    'completed',
    NULLIF(v_workout ->> 'notes', '')
  );

  FOR v_exercise IN SELECT * FROM jsonb_array_elements(COALESCE(payload -> 'exercises', '[]'::jsonb))
  LOOP
    v_we_id := (v_exercise ->> 'id')::uuid;

    INSERT INTO public.workout_exercises (
      id, user_id, workout_id, exercise_id, position, superset_group, is_adhoc
    ) VALUES (
      v_we_id,
      v_user_id,
      v_workout_id,
      (v_exercise ->> 'exercise_id')::uuid,
      (v_exercise ->> 'position')::integer,
      NULLIF(v_exercise ->> 'superset_group', '')::smallint,
      COALESCE((v_exercise ->> 'is_adhoc')::boolean, false)
    );

    FOR v_set IN SELECT * FROM jsonb_array_elements(COALESCE(v_exercise -> 'sets', '[]'::jsonb))
    LOOP
      INSERT INTO public.sets (
        id, user_id, workout_exercise_id, set_index,
        weight, reps, is_warmup, to_failure
      ) VALUES (
        (v_set ->> 'id')::uuid,
        v_user_id,
        v_we_id,
        (v_set ->> 'set_index')::integer,
        NULLIF(v_set ->> 'weight', '')::numeric,
        (v_set ->> 'reps')::integer,
        COALESCE((v_set ->> 'is_warmup')::boolean, false),
        COALESCE((v_set ->> 'to_failure')::boolean, false)
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('workout_id', v_workout_id, 'status', 'synced');
END;
$$;

REVOKE ALL ON FUNCTION private.finish_workout(jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.finish_workout(payload jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.finish_workout(payload);
$$;

REVOKE ALL ON FUNCTION public.finish_workout(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_workout(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.finish_workout(jsonb) FROM anon;
