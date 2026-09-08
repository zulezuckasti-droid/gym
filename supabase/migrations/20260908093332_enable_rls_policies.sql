ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercises_select ON public.exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY exercises_insert ON public.exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY exercises_update ON public.exercises FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY exercises_delete ON public.exercises FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY templates_select ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY templates_insert ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY templates_update ON public.templates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY templates_delete ON public.templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY template_exercises_select ON public.template_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY template_exercises_insert ON public.template_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY template_exercises_update ON public.template_exercises FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY template_exercises_delete ON public.template_exercises FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY workouts_select ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY workouts_insert ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workouts_update ON public.workouts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY workouts_delete ON public.workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY workout_exercises_select ON public.workout_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY workout_exercises_insert ON public.workout_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workout_exercises_update ON public.workout_exercises FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY workout_exercises_delete ON public.workout_exercises FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY sets_select ON public.sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sets_insert ON public.sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sets_update ON public.sets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sets_delete ON public.sets FOR DELETE USING (auth.uid() = user_id);
