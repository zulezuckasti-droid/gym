import type { FinishWorkoutPayload } from "@/lib/database.types";

export type SyncStatus = "local" | "pending" | "syncing" | "synced" | "failed";

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  exerciseCatalog: ExerciseCatalogItem[];
};

export type ExerciseCatalogItem = {
  exerciseId: string;
  name: string;
  previousSets: PreviousSet[];
  personalRecordWeight: number | null;
};

export type PreviousSet = {
  setIndex: number;
  weight: number | null;
  reps: number;
  toFailure: boolean;
};

export type TemplateExercise = {
  exerciseId: string;
  name: string;
  position: number;
  targetSets: number;
  previousSets: PreviousSet[];
  personalRecordWeight: number | null;
};

export type DraftSet = {
  id: string;
  setIndex: number;
  weight: string;
  reps: string;
  confirmed: boolean;
  isWarmup: boolean;
  toFailure: boolean;
  previous: PreviousSet | null;
};

export type DraftExercise = {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  personalRecordWeight: number | null;
  collapsed: boolean;
  sets: DraftSet[];
};

export type WorkoutDraft = {
  id: string;
  templateId: string | null;
  name: string;
  startedAt: string;
  notes: string;
  exercises: DraftExercise[];
  exerciseCatalog: ExerciseCatalogItem[];
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
