import type {
  ChartPoint,
  ExerciseWeightSeries,
  VolumePoint,
  WeekPoint,
} from "@/lib/progress/types";
import { formatVolume, workoutVolume } from "@/lib/workout/helpers";
import type { WorkoutView } from "@/lib/workout/types";

export function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatWeight(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : String(weight);
}

export function formatWeightReps(
  weight: number | null,
  reps: number,
): string {
  const load = weight === null ? "BW" : `${formatWeight(weight)} kg`;
  return `${load} × ${reps}`;
}

export function isoWeekStart(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayNum = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayNum}`;
}

export function volumeByWorkout(workouts: WorkoutView[]): VolumePoint[] {
  return workouts
    .slice()
    .sort((a, b) => a.performedOn.localeCompare(b.performedOn) || a.startedAt.localeCompare(b.startedAt))
    .map((workout) => ({
      workoutId: workout.id,
      name: workout.name,
      date: workout.performedOn,
      label: formatChartDate(workout.performedOn),
      volume: Math.round(workoutVolume(workout)),
    }));
}

export function workoutsByWeek(workouts: WorkoutView[]): WeekPoint[] {
  const counts = new Map<string, number>();
  for (const workout of workouts) {
    const weekStart = isoWeekStart(workout.performedOn);
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, count]) => ({
      weekStart,
      label: formatChartDate(weekStart),
      count,
    }));
}

export function maxWeightByExercise(
  workouts: WorkoutView[],
): ExerciseWeightSeries[] {
  const byExercise = new Map<
    string,
    { name: string; byDate: Map<string, number> }
  >();

  const chronological = workouts
    .slice()
    .sort(
      (a, b) =>
        a.performedOn.localeCompare(b.performedOn) ||
        a.startedAt.localeCompare(b.startedAt),
    );

  for (const workout of chronological) {
    for (const exercise of workout.exercises) {
      let max = 0;
      for (const set of exercise.sets) {
        if (set.isWarmup || set.reps < 1 || set.weight === null) continue;
        max = Math.max(max, set.weight);
      }
      if (max <= 0 || !exercise.exerciseId) continue;

      const current = byExercise.get(exercise.exerciseId) ?? {
        name: exercise.name,
        byDate: new Map<string, number>(),
      };
      current.byDate.set(
        workout.performedOn,
        Math.max(current.byDate.get(workout.performedOn) ?? 0, max),
      );
      byExercise.set(exercise.exerciseId, current);
    }
  }

  return [...byExercise.entries()]
    .map(([exerciseId, item]) => ({
      exerciseId,
      name: item.name,
      points: [...item.byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
          date,
          label: formatChartDate(date),
          value,
        })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function toMaxWeightPoints(
  history: Array<{
    performedOn: string;
    sets: Array<{ weight: number | null; reps: number; isWarmup: boolean }>;
  }>,
): ChartPoint[] {
  const byDate = new Map<string, number>();
  for (const group of history) {
    let max = 0;
    for (const set of group.sets) {
      if (set.isWarmup || set.reps < 1 || set.weight === null) continue;
      max = Math.max(max, set.weight);
    }
    if (max <= 0) continue;
    byDate.set(group.performedOn, Math.max(byDate.get(group.performedOn) ?? 0, max));
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: formatChartDate(date),
      value,
    }));
}

export function formatVolumeTick(value: number): string {
  return formatVolume(value).replace(" kg", "");
}
