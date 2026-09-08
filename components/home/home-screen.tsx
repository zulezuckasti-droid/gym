"use client";

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
import { draftHasConfirmedSet, formatTime } from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { WorkoutTemplate } from "@/lib/workout/types";

export function HomeScreen({
  templates,
  error,
}: {
  templates: WorkoutTemplate[];
  error: string | null;
}) {
  const router = useRouter();
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const draft = useWorkoutStore((state) => state.draft);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const openSummary = useWorkoutStore((state) => state.openSummary);
  const setPendingStart = useWorkoutStore((state) => state.setPendingStart);
  const [conflict, setConflict] = useState<WorkoutTemplate | null>(null);

  const activeDraft = hydrated && draft && !draft.completed ? draft : null;

  function goToWorkout(id: string) {
    router.push(`/workout/${id}`);
  }

  function handleStart(template: WorkoutTemplate) {
    if (!hydrated) return;
    if (activeDraft) {
      setConflict(template);
      return;
    }
    const id = startWorkout(template);
    if (id) goToWorkout(id);
  }

  function handleContinue() {
    if (!activeDraft) return;
    setConflict(null);
    goToWorkout(activeDraft.id);
  }

  function handleFinishAndStart() {
    if (!activeDraft || !conflict) return;
    const nextTemplate = conflict;
    setConflict(null);

    if (!draftHasConfirmedSet(activeDraft)) {
      goToWorkout(startWorkout(nextTemplate));
      return;
    }

    setPendingStart(nextTemplate);
    openSummary();
    goToWorkout(activeDraft.id);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>

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
            No workout templates yet.
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
              or finish it and start {conflict?.name}.
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
              Finish and start {conflict?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
