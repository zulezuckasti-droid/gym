import type { MuscleGroup } from "@/lib/content/constants";

export type ExerciseListItem = {
  id: string;
  name: string;
  muscle_group: string;
  type?: string;
};

export function groupExercisesByMuscle(
  exercises: ExerciseListItem[],
): Map<MuscleGroup | string, ExerciseListItem[]> {
  const grouped = new Map<MuscleGroup | string, ExerciseListItem[]>();
  for (const exercise of exercises) {
    const group = exercise.muscle_group;
    const current = grouped.get(group) ?? [];
    current.push(exercise);
    grouped.set(group, current);
  }
  return grouped;
}
