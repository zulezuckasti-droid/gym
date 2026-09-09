-- Bodyweight seed backfill and atomic reorder RPCs

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

  INSERT INTO public.exercises (user_id, name, muscle_group, type, is_custom)
  SELECT v_user_id, d.name, d.muscle_group, d.type, false
  FROM (
    VALUES
      ('Bench Press', 'Chest', 'weight_reps'),
      ('Incline Dumbbell Press', 'Chest', 'weight_reps'),
      ('Dumbbell Bench Press', 'Chest', 'weight_reps'),
      ('Cable Fly', 'Chest', 'weight_reps'),
      ('Pec Deck', 'Chest', 'weight_reps'),
      ('Push-Up', 'Chest', 'bodyweight'),
      ('Barbell Row', 'Back', 'weight_reps'),
      ('Lat Pulldown', 'Back', 'weight_reps'),
      ('Pull-Up', 'Back', 'bodyweight'),
      ('Chin-Up', 'Back', 'bodyweight'),
      ('Seated Cable Row', 'Back', 'weight_reps'),
      ('T-Bar Row', 'Back', 'weight_reps'),
      ('Deadlift', 'Back', 'weight_reps'),
      ('Face Pull', 'Back', 'weight_reps'),
      ('Shoulder Press', 'Shoulders', 'weight_reps'),
      ('Lateral Raise', 'Shoulders', 'weight_reps'),
      ('Rear Delt Fly', 'Shoulders', 'weight_reps'),
      ('Front Raise', 'Shoulders', 'weight_reps'),
      ('Upright Row', 'Shoulders', 'weight_reps'),
      ('Arnold Press', 'Shoulders', 'weight_reps'),
      ('Barbell Curl', 'Biceps', 'weight_reps'),
      ('Hammer Curl', 'Biceps', 'weight_reps'),
      ('Preacher Curl', 'Biceps', 'weight_reps'),
      ('Incline Dumbbell Curl', 'Biceps', 'weight_reps'),
      ('Cable Curl', 'Biceps', 'weight_reps'),
      ('Triceps Pushdown', 'Triceps', 'weight_reps'),
      ('Skull Crusher', 'Triceps', 'weight_reps'),
      ('Overhead Triceps Extension', 'Triceps', 'weight_reps'),
      ('Close-Grip Bench Press', 'Triceps', 'weight_reps'),
      ('Dips', 'Triceps', 'bodyweight'),
      ('Squat', 'Quads', 'weight_reps'),
      ('Leg Press', 'Quads', 'weight_reps'),
      ('Leg Extension', 'Quads', 'weight_reps'),
      ('Hack Squat', 'Quads', 'weight_reps'),
      ('Bulgarian Split Squat', 'Quads', 'weight_reps'),
      ('Front Squat', 'Quads', 'weight_reps'),
      ('Walking Lunge', 'Quads', 'weight_reps'),
      ('Romanian Deadlift', 'Hamstrings', 'weight_reps'),
      ('Leg Curl', 'Hamstrings', 'weight_reps'),
      ('Stiff-Leg Deadlift', 'Hamstrings', 'weight_reps'),
      ('Good Morning', 'Hamstrings', 'weight_reps'),
      ('Hip Thrust', 'Glutes', 'weight_reps'),
      ('Glute Bridge', 'Glutes', 'weight_reps'),
      ('Cable Kickback', 'Glutes', 'weight_reps'),
      ('Step-Up', 'Glutes', 'weight_reps'),
      ('Calf Raise', 'Calves', 'weight_reps'),
      ('Seated Calf Raise', 'Calves', 'weight_reps'),
      ('Donkey Calf Raise', 'Calves', 'weight_reps'),
      ('Cable Crunch', 'Core', 'weight_reps'),
      ('Hanging Leg Raise', 'Core', 'bodyweight'),
      ('Ab Wheel Rollout', 'Core', 'bodyweight'),
      ('Russian Twist', 'Core', 'bodyweight')
  ) AS d(name, muscle_group, type)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.exercises e
    WHERE e.user_id = v_user_id
      AND lower(e.name) = lower(d.name)
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.exercises
  SET type = 'bodyweight'
  WHERE user_id = v_user_id
    AND is_custom = false
    AND type IS DISTINCT FROM 'bodyweight'
    AND lower(name) IN (
      'push-up',
      'pull-up',
      'chin-up',
      'dips',
      'hanging leg raise',
      'ab wheel rollout',
      'russian twist'
    );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_default_exercises() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_exercises() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_exercises() FROM anon;

CREATE OR REPLACE FUNCTION public.reorder_template_exercises(
  p_template_id uuid,
  p_ordered_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  i integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.templates
    WHERE id = p_template_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  IF p_ordered_ids IS NULL OR array_length(p_ordered_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.template_exercises
  SET position = -position - 1
  WHERE template_id = p_template_id
    AND user_id = v_user_id;

  FOR i IN 1 .. array_length(p_ordered_ids, 1) LOOP
    UPDATE public.template_exercises
    SET position = i - 1
    WHERE id = p_ordered_ids[i]
      AND template_id = p_template_id
      AND user_id = v_user_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_template_exercises(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_template_exercises(uuid, uuid[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reorder_template_exercises(uuid, uuid[]) FROM anon;

CREATE OR REPLACE FUNCTION public.reorder_templates(p_ordered_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  i integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_ordered_ids IS NULL OR array_length(p_ordered_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.templates
  SET position = position + 100000
  WHERE user_id = v_user_id
    AND is_archived = false
    AND id = ANY (p_ordered_ids);

  FOR i IN 1 .. array_length(p_ordered_ids, 1) LOOP
    UPDATE public.templates
    SET position = i - 1
    WHERE id = p_ordered_ids[i]
      AND user_id = v_user_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_templates(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_templates(uuid[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reorder_templates(uuid[]) FROM anon;
