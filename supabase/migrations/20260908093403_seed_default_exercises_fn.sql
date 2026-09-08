CREATE OR REPLACE FUNCTION public.seed_default_exercises()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.exercises e WHERE e.user_id = v_user_id LIMIT 1) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.exercises (user_id, name, muscle_group, type, is_custom) VALUES
    (v_user_id, 'Bench Press', 'Chest', 'weight_reps', false),
    (v_user_id, 'Incline Dumbbell Press', 'Chest', 'weight_reps', false),
    (v_user_id, 'Barbell Row', 'Back', 'weight_reps', false),
    (v_user_id, 'Lat Pulldown', 'Back', 'weight_reps', false),
    (v_user_id, 'Shoulder Press', 'Shoulders', 'weight_reps', false),
    (v_user_id, 'Lateral Raise', 'Shoulders', 'weight_reps', false),
    (v_user_id, 'Barbell Curl', 'Biceps', 'weight_reps', false),
    (v_user_id, 'Triceps Pushdown', 'Triceps', 'weight_reps', false),
    (v_user_id, 'Squat', 'Quads', 'weight_reps', false),
    (v_user_id, 'Leg Press', 'Quads', 'weight_reps', false),
    (v_user_id, 'Romanian Deadlift', 'Hamstrings', 'weight_reps', false),
    (v_user_id, 'Hip Thrust', 'Glutes', 'weight_reps', false),
    (v_user_id, 'Calf Raise', 'Calves', 'weight_reps', false),
    (v_user_id, 'Cable Crunch', 'Core', 'weight_reps', false),
    (v_user_id, 'Pull-Up', 'Back', 'weight_reps', false);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_default_exercises() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_exercises() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_exercises() FROM anon;

CREATE OR REPLACE FUNCTION public.seed_default_push_template()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_template_id uuid;
  v_bench uuid;
  v_incline uuid;
  v_shoulder uuid;
  v_lateral uuid;
  v_triceps uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.templates t WHERE t.user_id = v_user_id AND t.name = 'Push' LIMIT 1) THEN
    SELECT t.id INTO v_template_id FROM public.templates t
    WHERE t.user_id = v_user_id AND t.name = 'Push' LIMIT 1;
    RETURN v_template_id;
  END IF;

  PERFORM public.seed_default_exercises();

  SELECT id INTO v_bench FROM public.exercises WHERE user_id = v_user_id AND name = 'Bench Press' LIMIT 1;
  SELECT id INTO v_incline FROM public.exercises WHERE user_id = v_user_id AND name = 'Incline Dumbbell Press' LIMIT 1;
  SELECT id INTO v_shoulder FROM public.exercises WHERE user_id = v_user_id AND name = 'Shoulder Press' LIMIT 1;
  SELECT id INTO v_lateral FROM public.exercises WHERE user_id = v_user_id AND name = 'Lateral Raise' LIMIT 1;
  SELECT id INTO v_triceps FROM public.exercises WHERE user_id = v_user_id AND name = 'Triceps Pushdown' LIMIT 1;

  INSERT INTO public.templates (user_id, name, position)
  VALUES (v_user_id, 'Push', 0)
  RETURNING id INTO v_template_id;

  INSERT INTO public.template_exercises (user_id, template_id, exercise_id, position, target_sets) VALUES
    (v_user_id, v_template_id, v_bench, 0, 3),
    (v_user_id, v_template_id, v_incline, 1, 3),
    (v_user_id, v_template_id, v_shoulder, 2, 3),
    (v_user_id, v_template_id, v_lateral, 3, 4),
    (v_user_id, v_template_id, v_triceps, 4, 3);

  RETURN v_template_id;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_default_push_template() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_push_template() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_push_template() FROM anon;
