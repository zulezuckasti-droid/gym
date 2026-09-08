"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDate,
  formatDuration,
  formatVolume,
  queuedToView,
  workoutVolume,
} from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { WorkoutView } from "@/lib/workout/types";

export function HistoryScreen({
  workouts,
  error,
}: {
  workouts: WorkoutView[];
  error: string | null;
}) {
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const queue = useWorkoutStore((state) => state.queue);

  const pending = hydrated
    ? queue
        .filter(
          (item) =>
            !workouts.some((workout) => workout.id === item.payload.workout.id),
        )
        .map(queuedToView)
    : [];

  const items = [...pending, ...workouts];

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-8">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Completed workouts will appear here.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((workout) => (
            <li key={workout.id}>
              <Link href={`/history/${workout.id}`} className="block">
                <Card className="py-0">
                  <CardContent className="flex min-h-20 items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(workout.performedOn)} ·{" "}
                        {formatDuration(workout.startedAt, workout.finishedAt)} ·{" "}
                        {formatVolume(workoutVolume(workout))}
                      </p>
                    </div>
                    {workout.pending ? (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                        Pending sync
                      </span>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
