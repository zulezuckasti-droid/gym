"use server";

import { revalidatePath } from "next/cache";
import type {
  Json,
  UpdateWorkoutHistoryPayload,
} from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string | null };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function validatePayload(payload: UpdateWorkoutHistoryPayload): string | null {
  if (!uuidPattern.test(payload.workout_id)) {
    return "Invalid workout.";
  }

  if (!isValidDate(payload.performed_on)) {
    return "Choose a valid date.";
  }

  const exerciseIds = new Set<string>();
  const setIds = new Set<string>();

  for (const exercise of payload.exercises) {
    if (!uuidPattern.test(exercise.id) || exerciseIds.has(exercise.id)) {
      return "Invalid workout exercise.";
    }
    exerciseIds.add(exercise.id);

    for (const set of exercise.sets) {
      if (!uuidPattern.test(set.id) || setIds.has(set.id)) {
        return "Invalid set.";
      }
      setIds.add(set.id);

      if (
        set.weight !== null &&
        (!Number.isFinite(set.weight) ||
          set.weight < 0 ||
          set.weight > 999999.99)
      ) {
        return "Weight must be between 0 and 999999.99 kg.";
      }

      if (!Number.isInteger(set.reps) || set.reps < 0) {
        return "Reps must be a whole number of 0 or more.";
      }
    }
  }

  return null;
}

export async function updateWorkoutHistory(
  payload: UpdateWorkoutHistoryPayload,
): Promise<ActionResult> {
  const validationError = validatePayload(payload);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_workout_history", {
    payload: payload as unknown as Json,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/history");
  revalidatePath(`/history/${payload.workout_id}`);
  revalidatePath("/");
  return { error: null };
}

export async function deleteWorkoutHistory(
  workoutId: string,
): Promise<ActionResult> {
  if (!uuidPattern.test(workoutId)) {
    return { error: "Invalid workout." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Workout not found." };
  }

  revalidatePath("/history");
  revalidatePath(`/history/${workoutId}`);
  revalidatePath("/");
  return { error: null };
}
