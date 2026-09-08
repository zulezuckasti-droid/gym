import { createClient } from "@/lib/supabase/server";
import type {
  ExerciseCatalogItem,
  PreviousSet,
  WorkoutTemplate,
  WorkoutView,
} from "@/lib/workout/types";

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

type PreviousRow = {
  exercise_id: string | null;
  set_index: number | null;
  weight: number | null;
  reps: number | null;
  to_failure: boolean | null;
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

function mapTemplate(
  row: TemplateRow,
  exerciseCatalog: ExerciseCatalogItem[],
  previousByExercise: Map<string, PreviousSet[]>,
  prsByExercise: Map<string, number>,
): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    exerciseCatalog,
    exercises: (row.template_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        exerciseId: item.exercise_id,
        name: item.exercises?.name ?? "Exercise",
        position: item.position,
        targetSets: item.target_sets,
        previousSets: previousByExercise.get(item.exercise_id) ?? [],
        personalRecordWeight: prsByExercise.get(item.exercise_id) ?? null,
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

  const [catalogResult, previousResult, workoutExercisesResult] =
    await Promise.all([
      supabase
        .from("exercises")
        .select("id, name")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("exercise_last_performance")
        .select("exercise_id, set_index, weight, reps, to_failure")
        .order("exercise_id")
        .order("set_index"),
      supabase.from("workout_exercises").select("id, exercise_id"),
    ]);

  const dataError =
    catalogResult.error ?? previousResult.error ?? workoutExercisesResult.error;
  if (dataError) {
    return { templates: [], error: dataError.message };
  }

  const catalogRows = catalogResult.data ?? [];

  const previousByExercise = new Map<string, PreviousSet[]>();
  for (const row of (previousResult.data ?? []) as PreviousRow[]) {
    if (
      !row.exercise_id ||
      row.set_index === null ||
      row.reps === null
    ) {
      continue;
    }
    const previous = previousByExercise.get(row.exercise_id) ?? [];
    previous.push({
      setIndex: row.set_index,
      weight: row.weight === null ? null : Number(row.weight),
      reps: row.reps,
      toFailure: row.to_failure ?? false,
    });
    previousByExercise.set(row.exercise_id, previous);
  }

  const workoutExerciseRows = workoutExercisesResult.data ?? [];
  const exerciseByWorkoutExercise = new Map(
    workoutExerciseRows.map((row) => [row.id, row.exercise_id]),
  );
  const workoutExerciseIds = workoutExerciseRows.map((row) => row.id);
  const prsByExercise = new Map<string, number>();

  if (workoutExerciseIds.length > 0) {
    const { data: setRows, error: setsError } = await supabase
      .from("sets")
      .select("workout_exercise_id, weight")
      .in("workout_exercise_id", workoutExerciseIds)
      .eq("is_warmup", false)
      .gt("reps", 0)
      .not("weight", "is", null);

    if (setsError) {
      return { templates: [], error: setsError.message };
    }

    for (const setRow of setRows ?? []) {
      const exerciseId = exerciseByWorkoutExercise.get(
        setRow.workout_exercise_id,
      );
      if (!exerciseId || setRow.weight === null) continue;
      const weight = Number(setRow.weight);
      prsByExercise.set(
        exerciseId,
        Math.max(prsByExercise.get(exerciseId) ?? 0, weight),
      );
    }
  }

  const exerciseCatalog: ExerciseCatalogItem[] = catalogRows.map((exercise) => ({
    exerciseId: exercise.id,
    name: exercise.name,
    previousSets: previousByExercise.get(exercise.id) ?? [],
    personalRecordWeight: prsByExercise.get(exercise.id) ?? null,
  }));

  return {
    templates: rows.map((row) =>
      mapTemplate(row, exerciseCatalog, previousByExercise, prsByExercise),
    ),
    error: null,
  };
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
