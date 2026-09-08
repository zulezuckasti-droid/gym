"use client";

import { useEffect } from "react";
import { useWorkoutStore } from "@/lib/workout/store";

export function WorkoutBootstrap() {
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const retryQueue = useWorkoutStore((state) => state.retryQueue);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      await useWorkoutStore.persist.rehydrate();
      if (!cancelled) {
        useWorkoutStore.getState().setHydrated();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { draft, queue } = useWorkoutStore.getState();
    const workoutIsActive = draft !== null && !draft.completed;
    if (queue.length > 0 && !workoutIsActive) {
      void retryQueue();
    }
  }, [hydrated, retryQueue]);

  useEffect(() => {
    function maybeRetry() {
      const state = useWorkoutStore.getState();
      const workoutIsActive = state.draft !== null && !state.draft.completed;
      if (
        !state.hydrated ||
        state.queue.length === 0 ||
        workoutIsActive
      ) {
        return;
      }
      void state.retryQueue();
    }

    function onVisible() {
      if (document.visibilityState === "visible") maybeRetry();
    }

    window.addEventListener("online", maybeRetry);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", maybeRetry);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
