CREATE OR REPLACE VIEW public.exercise_last_performance
WITH (security_invoker = true) AS
WITH last_per_exercise AS (
  SELECT DISTINCT ON (we.exercise_id)
    we.exercise_id,
    w.id AS workout_id,
    w.performed_on,
    w.finished_at,
    we.id AS workout_exercise_id
  FROM public.workout_exercises we
  JOIN public.workouts w ON w.id = we.workout_id
  WHERE w.status = 'completed'
  ORDER BY we.exercise_id, w.performed_on DESC, w.finished_at DESC NULLS LAST
)
SELECT
  l.exercise_id,
  l.workout_id,
  l.performed_on,
  l.finished_at,
  s.set_index,
  s.weight,
  s.reps,
  s.to_failure
FROM last_per_exercise l
JOIN public.sets s ON s.workout_exercise_id = l.workout_exercise_id
WHERE s.is_warmup = false
ORDER BY l.exercise_id, s.set_index;
