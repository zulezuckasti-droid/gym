CREATE INDEX IF NOT EXISTS workout_exercises_user_id_exercise_id_idx
  ON public.workout_exercises (user_id, exercise_id);

CREATE OR REPLACE VIEW public.exercise_prs
WITH (security_invoker = true) AS
SELECT DISTINCT ON (we.exercise_id)
  we.exercise_id,
  s.weight,
  s.reps,
  w.id AS workout_id,
  w.performed_on,
  w.finished_at
FROM public.sets s
JOIN public.workout_exercises we ON we.id = s.workout_exercise_id
JOIN public.workouts w ON w.id = we.workout_id
WHERE w.status = 'completed'
  AND s.is_warmup = false
  AND s.reps >= 1
  AND s.weight IS NOT NULL
ORDER BY we.exercise_id, s.weight DESC, s.reps DESC, w.performed_on DESC, w.finished_at DESC NULLS LAST;

COMMENT ON VIEW public.exercise_prs IS
  'Highest working-set weight per exercise (warmup excluded), with reps from that set.';
