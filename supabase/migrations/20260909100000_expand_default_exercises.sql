-- Expand default exercise library to ~50 and backfill missing defaults for existing users

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
  SELECT v_user_id, d.name, d.muscle_group, 'weight_reps', false
  FROM (
    VALUES
      ('Bench Press', 'Chest'),
      ('Incline Dumbbell Press', 'Chest'),
      ('Dumbbell Bench Press', 'Chest'),
      ('Cable Fly', 'Chest'),
      ('Pec Deck', 'Chest'),
      ('Push-Up', 'Chest'),
      ('Barbell Row', 'Back'),
      ('Lat Pulldown', 'Back'),
      ('Pull-Up', 'Back'),
      ('Chin-Up', 'Back'),
      ('Seated Cable Row', 'Back'),
      ('T-Bar Row', 'Back'),
      ('Deadlift', 'Back'),
      ('Face Pull', 'Back'),
      ('Shoulder Press', 'Shoulders'),
      ('Lateral Raise', 'Shoulders'),
      ('Rear Delt Fly', 'Shoulders'),
      ('Front Raise', 'Shoulders'),
      ('Upright Row', 'Shoulders'),
      ('Arnold Press', 'Shoulders'),
      ('Barbell Curl', 'Biceps'),
      ('Hammer Curl', 'Biceps'),
      ('Preacher Curl', 'Biceps'),
      ('Incline Dumbbell Curl', 'Biceps'),
      ('Cable Curl', 'Biceps'),
      ('Triceps Pushdown', 'Triceps'),
      ('Skull Crusher', 'Triceps'),
      ('Overhead Triceps Extension', 'Triceps'),
      ('Close-Grip Bench Press', 'Triceps'),
      ('Dips', 'Triceps'),
      ('Squat', 'Quads'),
      ('Leg Press', 'Quads'),
      ('Leg Extension', 'Quads'),
      ('Hack Squat', 'Quads'),
      ('Bulgarian Split Squat', 'Quads'),
      ('Front Squat', 'Quads'),
      ('Walking Lunge', 'Quads'),
      ('Romanian Deadlift', 'Hamstrings'),
      ('Leg Curl', 'Hamstrings'),
      ('Stiff-Leg Deadlift', 'Hamstrings'),
      ('Good Morning', 'Hamstrings'),
      ('Hip Thrust', 'Glutes'),
      ('Glute Bridge', 'Glutes'),
      ('Cable Kickback', 'Glutes'),
      ('Step-Up', 'Glutes'),
      ('Calf Raise', 'Calves'),
      ('Seated Calf Raise', 'Calves'),
      ('Donkey Calf Raise', 'Calves'),
      ('Cable Crunch', 'Core'),
      ('Hanging Leg Raise', 'Core'),
      ('Ab Wheel Rollout', 'Core'),
      ('Russian Twist', 'Core')
  ) AS d(name, muscle_group)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.exercises e
    WHERE e.user_id = v_user_id
      AND lower(e.name) = lower(d.name)
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_default_exercises() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_exercises() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_exercises() FROM anon;
