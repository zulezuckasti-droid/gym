import {
  maxWeightByExercise,
  toMaxWeightPoints,
  volumeByWorkout,
  workoutsByWeek,
} from "@/lib/progress/helpers";
import type {
  ExercisePr,
  ExerciseProgressData,
  ProgressData,
} from "@/lib/progress/types";
import { createClient } from "@/lib/supabase/server";
import { getHistoryWorkouts } from "@/lib/workout/queries";

type PrRow = {
  exercise_id: string | null;
  weight: number | null;
  reps: number | null;
  performed_on: string | null;
};

type WorkoutSummary = {
  id: string;
  name: string;
  performed_on: string;
  finished_at: string;
  status: string;
};

type HistoryRow = {
  workouts: WorkoutSummary | WorkoutSummary[] | null;
  sets: Array<{
    set_index: number;
    weight: number | null;
    reps: number;
    is_warmup: boolean;
    to_failure: boolean;
  }> | null;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getExerciseNames(
  ids: string[],
): Promise<{ names: Map<string, string>; error: string | null }> {
  if (ids.length === 0) {
    return { names: new Map(), error: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .in("id", ids);

  if (error) {
    return { names: new Map(), error: error.message };
  }

  return {
    names: new Map((data ?? []).map((row) => [row.id, row.name])),
    error: null,
  };
}

async function getExercisePrs(): Promise<{
  prs: ExercisePr[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_prs")
    .select("exercise_id, weight, reps, performed_on");

  if (error) {
    return { prs: [], error: error.message };
  }

  const rows = (data ?? []) as PrRow[];
  const ids = rows
    .map((row) => row.exercise_id)
    .filter((id): id is string => Boolean(id));
  const { names, error: namesError } = await getExerciseNames(ids);
  if (namesError) {
    return { prs: [], error: namesError };
  }

  const prs = rows
    .map((row) => {
      const weight = toNumber(row.weight);
      if (!row.exercise_id || weight === null || row.reps === null || !row.performed_on) {
        return null;
      }
      return {
        exerciseId: row.exercise_id,
        name: names.get(row.exercise_id) ?? "Exercise",
        weight,
        reps: row.reps,
        performedOn: row.performed_on,
      };
    })
    .filter((row): row is ExercisePr => row !== null)
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));

  return { prs, error: null };
}

export async function getProgressData(): Promise<ProgressData> {
  const [history, prsResult] = await Promise.all([
    getHistoryWorkouts(),
    getExercisePrs(),
  ]);

  const error = history.error ?? prsResult.error;
  if (error) {
    return {
      prs: [],
      volume: [],
      weekly: [],
      maxWeightByExercise: [],
      error,
    };
  }

  return {
    prs: prsResult.prs,
    volume: volumeByWorkout(history.workouts),
    weekly: workoutsByWeek(history.workouts),
    maxWeightByExercise: maxWeightByExercise(history.workouts),
    error: null,
  };
}

export async function getExerciseProgress(
  exerciseId: string,
): Promise<ExerciseProgressData> {
  const supabase = await createClient();

  const [prResult, historyResult, nameResult] = await Promise.all([
    supabase
      .from("exercise_prs")
      .select("exercise_id, weight, reps, performed_on")
      .eq("exercise_id", exerciseId)
      .maybeSingle(),
    supabase
      .from("workout_exercises")
      .select(
        `
        workouts!inner (
          id,
          name,
          performed_on,
          finished_at,
          status
        ),
        sets (
          set_index,
          weight,
          reps,
          is_warmup,
          to_failure
        )
      `,
      )
      .eq("exercise_id", exerciseId),
    supabase.from("exercises").select("name").eq("id", exerciseId).maybeSingle(),
  ]);

  const error =
    prResult.error?.message ??
    historyResult.error?.message ??
    nameResult.error?.message ??
    null;
  if (error) {
    return { pr: null, maxWeight: [], history: [], error };
  }

  const name = nameResult.data?.name ?? "Exercise";
  const prRow = prResult.data as PrRow | null;
  const prWeight = toNumber(prRow?.weight ?? null);
  const pr =
    prRow?.exercise_id &&
    prWeight !== null &&
    prRow.reps !== null &&
    prRow.performed_on
      ? {
          exerciseId,
          name,
          weight: prWeight,
          reps: prRow.reps,
          performedOn: prRow.performed_on,
        }
      : null;

  const history = ((historyResult.data ?? []) as unknown as HistoryRow[])
    .flatMap((row) => {
      const workout = Array.isArray(row.workouts)
        ? row.workouts[0]
        : row.workouts;
      if (!workout || workout.status !== "completed") return [];
      return [
        {
          workoutId: workout.id,
          workoutName: workout.name,
          performedOn: workout.performed_on,
          finishedAt: workout.finished_at,
          sets: (row.sets ?? [])
            .slice()
            .sort((a, b) => a.set_index - b.set_index)
            .map((set) => ({
              setIndex: set.set_index,
              weight: toNumber(set.weight),
              reps: set.reps,
              isWarmup: set.is_warmup,
              toFailure: set.to_failure,
            })),
        },
      ];
    })
    .sort(
      (a, b) =>
        b.performedOn.localeCompare(a.performedOn) ||
        b.finishedAt.localeCompare(a.finishedAt),
    )
    .map((group) => ({
      workoutId: group.workoutId,
      workoutName: group.workoutName,
      performedOn: group.performedOn,
      sets: group.sets,
    }));

  return {
    pr,
    maxWeight: toMaxWeightPoints(history),
    history,
    error: null,
  };
}
