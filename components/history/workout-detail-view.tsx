import Link from "next/link";
import {
  formatDate,
  formatDuration,
  formatVolume,
  workoutVolume,
} from "@/lib/workout/helpers";
import type { WorkoutView } from "@/lib/workout/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkoutDetailView({ workout }: { workout: WorkoutView }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-8">
      <Link
        href="/history"
        className="min-h-11 text-sm font-medium text-primary"
      >
        History
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(workout.performedOn)}
          </p>
        </div>
        {workout.pending ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            Pending sync
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {formatDuration(workout.startedAt, workout.finishedAt)} ·{" "}
        {formatVolume(workoutVolume(workout))}
      </p>

      {workout.notes ? (
        <p className="mt-3 text-sm">{workout.notes}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {workout.exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader>
              <CardTitle>{exercise.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercise.sets.map((set) => (
                <p key={set.id} className="text-sm">
                  Set {set.setIndex}
                  <span className="ml-3 text-muted-foreground">
                    {set.weight ?? 0} kg × {set.reps}
                  </span>
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
