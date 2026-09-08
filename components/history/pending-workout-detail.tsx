"use client";

import { notFound } from "next/navigation";
import { WorkoutDetailView } from "@/components/history/workout-detail-view";
import { queuedToView } from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";

export function PendingWorkoutDetail({ id }: { id: string }) {
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const item = useWorkoutStore((state) =>
    state.queue.find((queued) => queued.payload.workout.id === id),
  );

  if (!hydrated) {
    return (
      <main className="mx-auto flex min-h-64 w-full max-w-lg items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading workout…</p>
      </main>
    );
  }

  if (!item) {
    notFound();
  }

  return <WorkoutDetailView workout={queuedToView(item)} />;
}
