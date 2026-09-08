import type { FinishWorkoutPayload } from "@/lib/database.types";

export type SyncStatus = "local" | "pending" | "syncing" | "synced" | "failed";

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: TemplateExercise[];
};

export type TemplateExercise = {
  exerciseId: string;
  name: string;
  position: number;
  targetSets: number;
};

export type DraftSet = {
  id: string;
  setIndex: number;
  weight: string;
  reps: string;
  confirmed: boolean;
};

export type DraftExercise = {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  sets: DraftSet[];
};

export type WorkoutDraft = {
  id: string;
  templateId: string | null;
  name: string;
  startedAt: string;
  notes: string;
  exercises: DraftExercise[];
  showSummary: boolean;
  completed: boolean;
};

export type WorkoutView = {
  id: string;
  name: string;
  notes: string | null;
  performedOn: string;
  startedAt: string;
  finishedAt: string;
  pending: boolean;
  exercises: Array<{
    id: string;
    name: string;
    position: number;
    sets: Array<{
      id: string;
      setIndex: number;
      weight: number | null;
      reps: number;
      isWarmup: boolean;
      toFailure: boolean;
    }>;
  }>;
};

export type QueuedWorkout = {
  payload: FinishWorkoutPayload;
  exerciseNames: Record<string, string>;
};

export type { FinishWorkoutPayload };
