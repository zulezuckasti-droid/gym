"use client";

import { del, get, set as idbSet } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";
import {
  buildFinishPayload,
  canConfirmSet,
  createDraft,
  namesFromDraft,
} from "@/lib/workout/helpers";
import type {
  DraftSet,
  ExerciseCatalogItem,
  QueuedWorkout,
  SyncStatus,
  WorkoutDraft,
  WorkoutTemplate,
} from "@/lib/workout/types";

type WorkoutState = {
  hydrated: boolean;
  draft: WorkoutDraft | null;
  queue: QueuedWorkout[];
  syncStatus: SyncStatus;
  pendingStart: WorkoutTemplate | null;
  setHydrated: () => void;
  startWorkout: (template: WorkoutTemplate) => string;
  updateSet: (
    exerciseId: string,
    setId: string,
    patch: Pick<DraftSet, "weight" | "reps">,
  ) => void;
  confirmSet: (exerciseId: string, setId: string) => void;
  toggleSetFlag: (
    exerciseId: string,
    setId: string,
    flag: "isWarmup" | "toFailure",
  ) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  addSet: (exerciseId: string) => void;
  addExercise: (exercise: ExerciseCatalogItem) => void;
  toggleExerciseCollapsed: (exerciseId: string) => void;
  setNotes: (notes: string) => void;
  openSummary: () => void;
  closeSummary: () => void;
  setPendingStart: (template: WorkoutTemplate | null) => void;
  clearDraft: () => void;
  finishAndSync: () => Promise<SyncStatus>;
  retryQueue: () => Promise<SyncStatus>;
};

const idbStorage = createJSONStorage(() => ({
  getItem: async (name: string) => (await get<string>(name)) ?? null,
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
}));

if (!idbStorage) {
  throw new Error("Workout IndexedDB storage is unavailable");
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      draft: null,
      queue: [],
      syncStatus: "local",
      pendingStart: null,

      setHydrated: () => set({ hydrated: true }),

      startWorkout: (template) => {
        if (!get().hydrated) return "";
        const draft = createDraft(template);
        set({
          draft,
          pendingStart: null,
          syncStatus: get().queue.length > 0 ? get().syncStatus : "local",
        });
        return draft.id;
      },

      updateSet: (exerciseId, setId, patch) => {
        const draft = get().draft;
        if (!draft || draft.completed) return;

        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((exercise) => {
              if (exercise.id !== exerciseId) return exercise;
              return {
                ...exercise,
                sets: exercise.sets.map((current) => {
                  if (current.id !== setId) return current;
                  const next = { ...current, ...patch };
                  const unchanged =
                    next.weight === current.weight && next.reps === current.reps;
                  return unchanged ? current : { ...next, confirmed: false };
                }),
              };
            }),
          },
        });
      },

      confirmSet: (exerciseId, setId) => {
        const draft = get().draft;
        if (!draft || draft.completed) return;

        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((exercise) => {
              if (exercise.id !== exerciseId) return exercise;

              const target = exercise.sets.find((item) => item.id === setId);
              if (!target || !canConfirmSet(target)) return exercise;

              const nextConfirmed = !target.confirmed;

              const nextSets = exercise.sets.map(
                (current, index, sets) => {
                  if (current.id === setId) {
                    return { ...current, confirmed: nextConfirmed };
                  }

                  if (
                    nextConfirmed &&
                    !current.confirmed &&
                    !current.weight &&
                    !current.reps
                  ) {
                    const previous = sets[index - 1];
                    if (previous?.id === setId) {
                      return {
                        ...current,
                        weight: target.weight,
                        reps: target.reps,
                      };
                    }
                  }

                  return current;
                },
              );

              return {
                ...exercise,
                sets: nextSets,
                collapsed:
                  nextConfirmed && nextSets.every((current) => current.confirmed),
              };
            }),
          },
        });
      },

      toggleSetFlag: (exerciseId, setId, flag) => {
        const draft = get().draft;
        if (!draft || draft.completed) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((exercise) =>
              exercise.id === exerciseId
                ? {
                    ...exercise,
                    sets: exercise.sets.map((current) =>
                      current.id === setId
                        ? { ...current, [flag]: !current[flag] }
                        : current,
                    ),
                  }
                : exercise,
            ),
          },
        });
      },

      deleteSet: (exerciseId, setId) => {
        const draft = get().draft;
        if (!draft || draft.completed) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((exercise) => {
              if (exercise.id !== exerciseId || exercise.sets.length <= 1) {
                return exercise;
              }
              return {
                ...exercise,
                collapsed: false,
                sets: exercise.sets
                  .filter((current) => current.id !== setId)
                  .map((current, index) => ({
                    ...current,
                    setIndex: index + 1,
                  })),
              };
            }),
          },
        });
      },

      addSet: (exerciseId) => {
        const draft = get().draft;
        if (!draft || draft.completed) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((exercise) => {
              if (exercise.id !== exerciseId) return exercise;
              const previous = exercise.sets.at(-1);
              return {
                ...exercise,
                collapsed: false,
                sets: [
                  ...exercise.sets,
                  {
                    id: crypto.randomUUID(),
                    setIndex: exercise.sets.length + 1,
                    weight: previous?.weight ?? "",
                    reps: previous?.reps ?? "",
                    confirmed: false,
                    isWarmup: false,
                    toFailure: false,
                    previous: null,
                  },
                ],
              };
            }),
          },
        });
      },

      addExercise: (catalogExercise) => {
        const draft = get().draft;
        if (
          !draft ||
          draft.completed ||
          draft.exercises.some(
            (exercise) => exercise.exerciseId === catalogExercise.exerciseId,
          )
        ) {
          return;
        }

        set({
          draft: {
            ...draft,
            exercises: [
              ...draft.exercises,
              {
                id: crypto.randomUUID(),
                exerciseId: catalogExercise.exerciseId,
                name: catalogExercise.name,
                position: draft.exercises.length,
                personalRecordWeight: catalogExercise.personalRecordWeight,
                collapsed: false,
                sets: Array.from({ length: 3 }, (_, index) => {
                  const previous = catalogExercise.previousSets[index] ?? null;
                  return {
                    id: crypto.randomUUID(),
                    setIndex: index + 1,
                    weight:
                      previous?.weight === null || previous === null
                        ? ""
                        : String(previous.weight),
                    reps: previous === null ? "" : String(previous.reps),
                    confirmed: false,
                    isWarmup: false,
                    toFailure: false,
                    previous,
                  };
                }),
              },
            ],
          },
        });
      },

      toggleExerciseCollapsed: (exerciseId) => {
        const draft = get().draft;
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((exercise) =>
              exercise.id === exerciseId
                ? { ...exercise, collapsed: !exercise.collapsed }
                : exercise,
            ),
          },
        });
      },

      setNotes: (notes) => {
        const draft = get().draft;
        if (!draft) return;
        set({ draft: { ...draft, notes } });
      },

      openSummary: () => {
        const draft = get().draft;
        if (!draft) return;
        set({ draft: { ...draft, showSummary: true } });
      },

      closeSummary: () => {
        const draft = get().draft;
        if (!draft || draft.completed) return;
        set({ draft: { ...draft, showSummary: false } });
      },

      setPendingStart: (template) => set({ pendingStart: template }),

      clearDraft: () => set({ draft: null, pendingStart: null }),

      finishAndSync: async () => {
        const draft = get().draft;
        if (!draft) return get().syncStatus;

        const existing = get().queue.find(
          (item) => item.payload.workout.id === draft.id,
        );
        const queued: QueuedWorkout = existing ?? {
          payload: buildFinishPayload(draft),
          exerciseNames: namesFromDraft(draft),
        };

        set({
          draft: { ...draft, completed: true, showSummary: true },
          queue: existing ? get().queue : [...get().queue, queued],
        });

        return get().retryQueue();
      },

      retryQueue: async () => {
        const { queue, syncStatus } = get();
        if (queue.length === 0) {
          if (syncStatus === "syncing") set({ syncStatus: "synced" });
          return get().syncStatus;
        }
        if (syncStatus === "syncing") return syncStatus;

        set({ syncStatus: "syncing" });
        const supabase = createClient();

        for (let index = 0; index < queue.length; index += 1) {
          const item = queue[index];
          const { error } = await supabase.rpc("finish_workout", {
            payload: item.payload as unknown as Json,
          });

          if (error) {
            const offline =
              typeof navigator !== "undefined" && !navigator.onLine;
            set({
              queue: queue.slice(index),
              syncStatus: offline ? "pending" : "failed",
            });
            return get().syncStatus;
          }
        }

        set({ queue: [], syncStatus: "synced" });
        return "synced";
      },
    }),
    {
      name: "gym-workout-v1",
      storage: idbStorage,
      skipHydration: true,
      partialize: (state) => ({
        draft: state.draft,
        queue: state.queue,
        syncStatus:
          state.syncStatus === "syncing" ? "pending" : state.syncStatus,
        pendingStart: state.pendingStart,
      }),
    },
  ),
);
