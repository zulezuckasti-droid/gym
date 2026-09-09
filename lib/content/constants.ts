export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EXERCISE_TYPES = ["weight_reps", "bodyweight"] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EMPTY_WORKOUT_NAME = "Empty Workout";

export function exerciseTypeLabel(type: ExerciseType): string {
  return type === "bodyweight" ? "Bodyweight" : "Weight × reps";
}

export function asExerciseType(value: string | null | undefined): ExerciseType {
  return value === "bodyweight" ? "bodyweight" : "weight_reps";
}
