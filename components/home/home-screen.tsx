"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMPTY_WORKOUT_NAME } from "@/lib/content/constants";
import { draftHasConfirmedSet, formatTime } from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { ExerciseCatalogItem, WorkoutTemplate } from "@/lib/workout/types";

const EMPTY_WORKOUT_MARKER = "empty" as const;
type PendingStart = WorkoutTemplate | typeof EMPTY_WORKOUT_MARKER;

export function HomeScreen({
  templates,
  exerciseCatalog,
  error,
}: {
  templates: WorkoutTemplate[];
  exerciseCatalog: ExerciseCatalogItem[];
  error: string | null;
}) {
  const router = useRouter();
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const draft = useWorkoutStore((state) => state.draft);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const startEmptyWorkout = useWorkoutStore((state) => state.startEmptyWorkout);
  const openSummary = useWorkoutStore((state) => state.openSummary);
  const setPendingStart = useWorkoutStore((state) => state.setPendingStart);
  const [conflict, setConflict] = useState<PendingStart | null>(null);

  const activeDraft = hydrated && draft && !draft.completed ? draft : null;

  function goToWorkout(id: string) {
    router.push(`/workout/${id}`);
  }

  function beginWorkout(next: PendingStart) {
    if (!hydrated) return;
    if (activeDraft) {
      setConflict(next);
      return;
    }
    if (next === EMPTY_WORKOUT_MARKER) {
      const id = startEmptyWorkout(exerciseCatalog);
      if (id) goToWorkout(id);
      return;
    }
    const id = startWorkout(next);
    if (id) goToWorkout(id);
  }

  function handleStart(template: WorkoutTemplate) {
    beginWorkout(template);
  }

  function handleEmptyWorkout() {
    beginWorkout(EMPTY_WORKOUT_MARKER);
  }

  function handleContinue() {
    if (!activeDraft) return;
    setConflict(null);
    goToWorkout(activeDraft.id);
  }

  function startAfterConflict(next: PendingStart) {
    if (next === EMPTY_WORKOUT_MARKER) {
      const id = startEmptyWorkout(exerciseCatalog);
      return id || null;
    }
    return startWorkout(next) || null;
  }

  function conflictLabel(next: PendingStart | null) {
    if (next === EMPTY_WORKOUT_MARKER) return EMPTY_WORKOUT_NAME;
    return next?.name ?? "workout";
  }

  function handleFinishAndStart() {
    if (!activeDraft || conflict === null) return;
    const next = conflict;
    setConflict(null);

    if (!draftHasConfirmedSet(activeDraft)) {
      const id = startAfterConflict(next);
      if (id) goToWorkout(id);
      return;
    }

    if (next === EMPTY_WORKOUT_MARKER) {
      setPendingStart({
        id: "",
        name: EMPTY_WORKOUT_NAME,
        exercises: [],
        exerciseCatalog,
      });
    } else {
      setPendingStart(next);
    }
    openSummary();
    goToWorkout(activeDraft.id);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/templates"
            className="min-h-11 px-2 py-2 text-muted-foreground hover:text-foreground"
          >
            Templates
          </Link>
          <Link
            href="/exercises"
            className="min-h-11 px-2 py-2 text-muted-foreground hover:text-foreground"
          >
            Exercises
          </Link>
        </div>
      </div>

      {activeDraft ? (
        <button
          type="button"
          onClick={handleContinue}
          className="mt-4 min-h-14 rounded-xl bg-primary/15 px-4 py-3 text-left ring-1 ring-primary/30"
        >
          <p className="text-sm font-medium text-primary">
            Continue {activeDraft.name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Started {formatTime(activeDraft.startedAt)}
          </p>
        </button>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-6 space-y-3">
        {templates.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            No workout templates yet. Create one in Templates.
          </p>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="py-0">
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => handleStart(template)}
                  className="flex min-h-20 w-full items-center px-5 text-left text-xl font-semibold tracking-tight"
                >
                  {template.name}
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Button
        type="button"
        variant="outline"
        className="mt-4 h-14 w-full text-base"
        onClick={handleEmptyWorkout}
      >
        Empty Workout
      </Button>

      <Dialog
        open={conflict !== null}
        onOpenChange={(open) => {
          if (!open) setConflict(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Unfinished workout</DialogTitle>
            <DialogDescription>
              You have an unfinished {activeDraft?.name} workout. Continue it,
              or finish it and start {conflictLabel(conflict)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col">
            <Button className="h-11 w-full" onClick={handleContinue}>
              Continue {activeDraft?.name}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={handleFinishAndStart}
            >
              Finish and start {conflictLabel(conflict)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
