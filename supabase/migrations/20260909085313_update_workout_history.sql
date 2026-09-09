CREATE OR REPLACE FUNCTION public.update_workout_history(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_workout_id uuid := NULLIF(payload ->> 'workout_id', '')::uuid;
  v_performed_on date := NULLIF(payload ->> 'performed_on', '')::date;
  v_exercises jsonb := COALESCE(payload -> 'exercises', '[]'::jsonb);
  v_exercise jsonb;
  v_set jsonb;
  v_workout_exercise_id uuid;
  v_expected_exercises integer;
  v_payload_exercises integer;
  v_distinct_exercises integer;
  v_set_index integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_workout_id IS NULL OR v_performed_on IS NULL THEN
    RAISE EXCEPTION 'Invalid payload: workout_id and performed_on are required';
  END IF;

  IF jsonb_typeof(v_exercises) <> 'array' THEN
    RAISE EXCEPTION 'Invalid payload: exercises must be an array';
  END IF;

  UPDATE public.workouts
  SET performed_on = v_performed_on
  WHERE id = v_workout_id
    AND user_id = v_user_id
    AND status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found';
  END IF;

  SELECT count(*)
  INTO v_expected_exercises
  FROM public.workout_exercises
  WHERE workout_id = v_workout_id
    AND user_id = v_user_id;

  v_payload_exercises := jsonb_array_length(v_exercises);

  SELECT count(DISTINCT exercise ->> 'id')
  INTO v_distinct_exercises
  FROM jsonb_array_elements(v_exercises) AS exercise;

  IF v_payload_exercises <> v_expected_exercises
    OR v_distinct_exercises <> v_expected_exercises THEN
    RAISE EXCEPTION 'Invalid payload: exercises do not match workout';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_exercises) AS exercise
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.workout_exercises workout_exercise
      WHERE workout_exercise.id = (exercise ->> 'id')::uuid
        AND workout_exercise.workout_id = v_workout_id
        AND workout_exercise.user_id = v_user_id
    )
  ) THEN
    RAISE EXCEPTION 'Invalid payload: exercise does not belong to workout';
  END IF;

  DELETE FROM public.sets
  WHERE user_id = v_user_id
    AND workout_exercise_id IN (
      SELECT id
      FROM public.workout_exercises
      WHERE workout_id = v_workout_id
        AND user_id = v_user_id
    );

  FOR v_exercise IN
    SELECT value FROM jsonb_array_elements(v_exercises)
  LOOP
    v_workout_exercise_id := (v_exercise ->> 'id')::uuid;
    v_set_index := 0;

    IF jsonb_typeof(COALESCE(v_exercise -> 'sets', '[]'::jsonb)) <> 'array' THEN
      RAISE EXCEPTION 'Invalid payload: sets must be an array';
    END IF;

    FOR v_set IN
      SELECT value
      FROM jsonb_array_elements(COALESCE(v_exercise -> 'sets', '[]'::jsonb))
    LOOP
      v_set_index := v_set_index + 1;

      INSERT INTO public.sets (
        id,
        user_id,
        workout_exercise_id,
        set_index,
        weight,
        reps,
        is_warmup,
        to_failure
      ) VALUES (
        (v_set ->> 'id')::uuid,
        v_user_id,
        v_workout_exercise_id,
        v_set_index,
        NULLIF(v_set ->> 'weight', '')::numeric,
        (v_set ->> 'reps')::integer,
        COALESCE((v_set ->> 'is_warmup')::boolean, false),
        COALESCE((v_set ->> 'to_failure')::boolean, false)
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'workout_id', v_workout_id,
    'status', 'updated'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_workout_history(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_workout_history(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_workout_history(jsonb) TO authenticated;
