"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportGymData(): Promise<{
  error: string | null;
  data?: unknown;
}> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return { error: "Not authenticated." };
  }

  const [
    exercises,
    templates,
    templateExercises,
    workouts,
    workoutExercises,
    sets,
  ] = await Promise.all([
    supabase.from("exercises").select("*").order("created_at"),
    supabase.from("templates").select("*").order("position"),
    supabase.from("template_exercises").select("*").order("position"),
    supabase
      .from("workouts")
      .select("*")
      .order("performed_on", { ascending: false }),
    supabase.from("workout_exercises").select("*").order("position"),
    supabase.from("sets").select("*").order("set_index"),
  ]);

  const firstError =
    exercises.error ??
    templates.error ??
    templateExercises.error ??
    workouts.error ??
    workoutExercises.error ??
    sets.error;

  if (firstError) {
    return { error: firstError.message };
  }

  return {
    error: null,
    data: {
      exportedAt: new Date().toISOString(),
      exercises: exercises.data ?? [],
      templates: templates.data ?? [],
      template_exercises: templateExercises.data ?? [],
      workouts: workouts.data ?? [],
      workout_exercises: workoutExercises.data ?? [],
      sets: sets.data ?? [],
    },
  };
}
