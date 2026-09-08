import type { FinishWorkoutPayload } from "@/lib/database.types";
import type {
  DraftExercise,
  DraftSet,
  PreviousSet,
  WorkoutDraft,
  WorkoutTemplate,
  WorkoutView,
} from "@/lib/workout/types";

export function formatInputNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

export function createDraft(template: WorkoutTemplate): WorkoutDraft {
  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    name: template.name,
    startedAt: new Date().toISOString(),
    notes: "",
    showSummary: false,
    completed: false,
    exerciseCatalog: template.exerciseCatalog,
    exercises: template.exercises
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((exercise, position) => ({
        id: crypto.randomUUID(),
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        position,
        personalRecordWeight: exercise.personalRecordWeight,
        collapsed: false,
        sets: Array.from({ length: exercise.targetSets }, (_, index) => ({
          id: crypto.randomUUID(),
          setIndex: index + 1,
          weight: formatInputNumber(exercise.previousSets[index]?.weight ?? null),
          reps: formatInputNumber(exercise.previousSets[index]?.reps ?? null),
          confirmed: false,
          isWarmup: false,
          toFailure: false,
          previous: exercise.previousSets[index] ?? null,
        })),
      })),
  };
}

export function parseWeight(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseReps(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function canConfirmSet(set: DraftSet): boolean {
  return parseWeight(set.weight) !== null && parseReps(set.reps) !== null;
}

export function draftHasConfirmedSet(draft: WorkoutDraft): boolean {
  return draft.exercises.some((exercise) =>
    exercise.sets.some((set) => set.confirmed),
  );
}

export function toLocalDate(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildFinishPayload(draft: WorkoutDraft): FinishWorkoutPayload {
  return {
    workout: {
      id: draft.id,
      template_id: draft.templateId,
      name: draft.name,
      performed_on: toLocalDate(draft.startedAt),
      started_at: draft.startedAt,
      finished_at: new Date().toISOString(),
      notes: draft.notes.trim() || null,
    },
    exercises: draft.exercises
      .map((exercise) => ({
        id: exercise.id,
        exercise_id: exercise.exerciseId,
        position: exercise.position,
        sets: exercise.sets
          .filter((set) => set.confirmed)
          .map((set) => ({
            id: set.id,
            set_index: set.setIndex,
            weight: parseWeight(set.weight),
            reps: parseReps(set.reps) ?? 0,
            is_warmup: set.isWarmup,
            to_failure: set.toFailure,
          })),
      }))
      .filter((exercise) => exercise.sets.length > 0),
  };
}

export function workoutVolume(view: {
  exercises: Array<{
    sets: Array<{
      weight: number | null;
      reps: number;
      isWarmup?: boolean;
    }>;
  }>;
}): number {
  return view.exercises.reduce((exerciseTotal, exercise) => {
    return (
      exerciseTotal +
      exercise.sets.reduce((setTotal, set) => {
        if (set.isWarmup) return setTotal;
        return setTotal + (set.weight ?? 0) * set.reps;
      }, 0)
    );
  }, 0);
}

export function draftVolume(draft: WorkoutDraft): number {
  return workoutVolume({
    exercises: draft.exercises.map((exercise) => ({
      sets: exercise.sets
        .filter((set) => set.confirmed)
        .map((set) => ({
          weight: parseWeight(set.weight),
          reps: parseReps(set.reps) ?? 0,
          isWarmup: set.isWarmup,
        })),
    })),
  });
}

export function draftExerciseVolume(exercise: DraftExercise): number {
  return exercise.sets.reduce((total, set) => {
    if (!set.confirmed || set.isWarmup) return total;
    return total + (parseWeight(set.weight) ?? 0) * (parseReps(set.reps) ?? 0);
  }, 0);
}

export function isPersonalRecordSet(
  exercise: DraftExercise,
  target: DraftSet,
): boolean {
  if (!target.confirmed || target.isWarmup) return false;
  const targetWeight = parseWeight(target.weight);
  if (targetWeight === null || targetWeight <= 0) return false;

  let record = exercise.personalRecordWeight ?? 0;
  for (const set of exercise.sets) {
    if (set.id === target.id) return targetWeight > record;
    if (!set.confirmed || set.isWarmup) continue;
    record = Math.max(record, parseWeight(set.weight) ?? 0);
  }
  return false;
}

export function formatPrevious(previous: PreviousSet | null): string {
  if (!previous) return "—";
  const weight = previous.weight === null ? "BW" : `${previous.weight} kg`;
  return `${weight} × ${previous.reps}${previous.toFailure ? " †" : ""}`;
}

export function formatVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString("en-US")} kg`;
}

export function formatDuration(startedAt: string, finishedAt: string): string {
  const ms = Math.max(
    0,
    new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
  );
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(value: string): string {
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function queuedToView(item: {
  payload: FinishWorkoutPayload;
  exerciseNames: Record<string, string>;
}): WorkoutView {
  const { payload, exerciseNames } = item;
  return {
    id: payload.workout.id,
    name: payload.workout.name,
    notes: payload.workout.notes ?? null,
    performedOn: payload.workout.performed_on,
    startedAt: payload.workout.started_at,
    finishedAt: payload.workout.finished_at,
    pending: true,
    exercises: payload.exercises.map((exercise) => ({
      id: exercise.id,
      name: exerciseNames[exercise.id] ?? "Exercise",
      position: exercise.position,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        setIndex: set.set_index,
        weight: set.weight ?? null,
        reps: set.reps,
        isWarmup: set.is_warmup ?? false,
        toFailure: set.to_failure ?? false,
      })),
    })),
  };
}

export function namesFromDraft(draft: WorkoutDraft): Record<string, string> {
  return Object.fromEntries(
    draft.exercises.map((exercise) => [exercise.id, exercise.name]),
  );
}
