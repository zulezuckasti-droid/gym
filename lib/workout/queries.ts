import { createClient } from "@/lib/supabase/server";
import type { WorkoutTemplate, WorkoutView } from "@/lib/workout/types";

type TemplateRow = {
  id: string;
  name: string;
  position: number;
  template_exercises: Array<{
    exercise_id: string;
    position: number;
    target_sets: number;
    exercises: { name: string } | null;
  }> | null;
};

type WorkoutRow = {
  id: string;
  name: string;
  notes: string | null;
  performed_on: string;
  started_at: string;
  finished_at: string;
  workout_exercises: Array<{
    id: string;
    position: number;
    exercises: { name: string } | null;
    sets: Array<{
      id: string;
      set_index: number;
      weight: number | null;
      reps: number;
      is_warmup: boolean;
      to_failure: boolean;
    }> | null;
  }> | null;
};

const templateSelect = `
  id,
  name,
  position,
  template_exercises (
    exercise_id,
    position,
    target_sets,
    exercises ( name )
  )
`;

const workoutSelect = `
  id,
  name,
  notes,
  performed_on,
  started_at,
  finished_at,
  workout_exercises (
    id,
    position,
    exercises ( name ),
    sets (
      id,
      set_index,
      weight,
      reps,
      is_warmup,
      to_failure
    )
  )
`;

function mapTemplate(row: TemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    exercises: (row.template_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        exerciseId: item.exercise_id,
        name: item.exercises?.name ?? "Exercise",
        position: item.position,
        targetSets: item.target_sets,
      })),
  };
}

function mapWorkout(row: WorkoutRow, pending = false): WorkoutView {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    performedOn: row.performed_on,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    pending,
    exercises: (row.workout_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.exercises?.name ?? "Exercise",
        position: exercise.position,
        sets: (exercise.sets ?? [])
          .slice()
          .sort((a, b) => a.set_index - b.set_index)
          .map((set) => ({
            id: set.id,
            setIndex: set.set_index,
            weight: set.weight,
            reps: set.reps,
            isWarmup: set.is_warmup,
            toFailure: set.to_failure,
          })),
      })),
  };
}

export async function getHomeTemplates(): Promise<{
  templates: WorkoutTemplate[];
  error: string | null;
}> {
  const supabase = await createClient();

  async function fetchTemplates() {
    return supabase
      .from("templates")
      .select(templateSelect)
      .eq("is_archived", false)
      .order("position");
  }

  const first = await fetchTemplates();
  if (first.error) {
    return { templates: [], error: first.error.message };
  }

  let rows = (first.data ?? []) as unknown as TemplateRow[];
  if (rows.length === 0) {
    const seeded = await supabase.rpc("seed_default_push_template");
    if (seeded.error) {
      return { templates: [], error: seeded.error.message };
    }
    const second = await fetchTemplates();
    if (second.error) {
      return { templates: [], error: second.error.message };
    }
    rows = (second.data ?? []) as unknown as TemplateRow[];
  }

  return { templates: rows.map(mapTemplate), error: null };
}

export async function getHistoryWorkouts(): Promise<{
  workouts: WorkoutView[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select(workoutSelect)
    .eq("status", "completed")
    .order("performed_on", { ascending: false })
    .order("started_at", { ascending: false });

  if (error) {
    return { workouts: [], error: error.message };
  }

  return {
    workouts: ((data ?? []) as unknown as WorkoutRow[]).map((row) =>
      mapWorkout(row),
    ),
    error: null,
  };
}

export async function getWorkoutById(
  id: string,
): Promise<{ workout: WorkoutView | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select(workoutSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { workout: null, error: error.message };
  }
  if (!data) {
    return { workout: null, error: null };
  }

  return {
    workout: mapWorkout(data as unknown as WorkoutRow),
    error: null,
  };
}
