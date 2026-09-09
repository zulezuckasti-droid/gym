"use client";

import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutExerciseCard } from "@/components/workout/workout-exercise-card";
import { WorkoutSupersetCard } from "@/components/workout/workout-superset-card";
import { addExerciseToTemplate } from "@/lib/content/actions";
import { EMPTY_WORKOUT_NAME } from "@/lib/content/constants";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { groupExercises } from "@/lib/workout/grouping";
import {
  draftHasConfirmedSet,
  draftVolume,
  formatDuration,
  formatVolume,
  newPersonalRecords,
} from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { ExerciseCatalogItem } from "@/lib/workout/types";

type AdhocPrompt = {
  draftExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  templateId: string;
  templateName: string;
};

export function ActiveWorkout({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [adhocPrompt, setAdhocPrompt] = useState<AdhocPrompt | null>(null);
  const [pending, startTransition] = useTransition();
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const draft = useWorkoutStore((state) => state.draft);
  const syncStatus = useWorkoutStore((state) => state.syncStatus);
  const pendingStart = useWorkoutStore((state) => state.pendingStart);
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const markExerciseInTemplate = useWorkoutStore(
    (state) => state.markExerciseInTemplate,
  );
  const setNotes = useWorkoutStore((state) => state.setNotes);
  const openSummary = useWorkoutStore((state) => state.openSummary);
  const closeSummary = useWorkoutStore((state) => state.closeSummary);
  const finishAndSync = useWorkoutStore((state) => state.finishAndSync);
  const retryQueue = useWorkoutStore((state) => state.retryQueue);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const startEmptyWorkout = useWorkoutStore((state) => state.startEmptyWorkout);
  const clearDraft = useWorkoutStore((state) => state.clearDraft);
  const setPendingStart = useWorkoutStore((state) => state.setPendingStart);
  useWakeLock(Boolean(draft && !draft.completed));

  function startPendingWorkout() {
    const state = useWorkoutStore.getState();
    if (!state.pendingStart) return null;
    if (
      !state.pendingStart.id &&
      state.pendingStart.name === EMPTY_WORKOUT_NAME
    ) {
      return startEmptyWorkout(state.draft?.exerciseCatalog ?? []);
    }
    return startWorkout(state.pendingStart);
  }

  function handleSelectExercise(item: ExerciseCatalogItem) {
    const draftExerciseId = addExercise(item);
    setAddExerciseOpen(false);
    if (!draftExerciseId || !draft?.templateId) return;
    setAdhocPrompt({
      draftExerciseId,
      exerciseId: item.exerciseId,
      exerciseName: item.name,
      templateId: draft.templateId,
      templateName: draft.name,
    });
  }

  function handleAddToTemplate() {
    if (!adhocPrompt) return;
    startTransition(async () => {
      const result = await addExerciseToTemplate(
        adhocPrompt.templateId,
        adhocPrompt.exerciseId,
      );
      if (!result.error) {
        markExerciseInTemplate(adhocPrompt.draftExerciseId);
      }
      setAdhocPrompt(null);
    });
  }

  if (!hydrated) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading workout…</p>
      </main>
    );
  }

  if (!draft || draft.id !== workoutId) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          This workout is no longer on this device.
        </p>
        <Button className="h-11" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </main>
    );
  }

  const workout = draft;

  const hasConfirmed = draftHasConfirmedSet(workout);
  const isSyncing = syncStatus === "syncing";

  async function handleDone() {
    const status = await finishAndSync();
    const state = useWorkoutStore.getState();
    const stillQueued = state.queue.some(
      (item) => item.payload.workout.id === workoutId,
    );

    if (state.pendingStart) {
      const nextId = startPendingWorkout();
      if (nextId) router.push(`/workout/${nextId}`);
      return;
    }

    if (status === "synced" && !stillQueued) {
      clearDraft();
      router.push(`/history/${workoutId}`);
      router.refresh();
    }
  }

  async function handleRetry() {
    const status = await retryQueue();
    const state = useWorkoutStore.getState();
    const stillQueued = state.queue.some(
      (item) => item.payload.workout.id === workoutId,
    );
    if (status === "synced" && !stillQueued) {
      if (state.pendingStart) {
        const nextId = startPendingWorkout();
        if (nextId) router.push(`/workout/${nextId}`);
        return;
      }
      clearDraft();
      router.push(`/history/${workoutId}`);
      router.refresh();
    }
  }

  function handleClose() {
    if (workout.completed) {
      setPendingStart(null);
      clearDraft();
    }
    router.push("/");
  }

  if (draft.showSummary) {
    const finishedAt = new Date().toISOString();
    const queued = useWorkoutStore
      .getState()
      .queue.find((item) => item.payload.workout.id === draft.id);
    const durationEnd = queued?.payload.workout.finished_at ?? finishedAt;
    const prs = newPersonalRecords(draft);

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-2">
          {draft.completed ? (
            <span className="w-11" />
          ) : (
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-11"
              aria-label="Back to workout"
              onClick={closeSummary}
            >
              <X className="size-5" />
            </Button>
          )}
          <h1 className="flex-1 text-center text-lg font-semibold">
            Workout summary
          </h1>
          <span className="w-11" />
        </header>

        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{draft.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Duration {formatDuration(draft.startedAt, durationEnd)}
              </p>
              <p className="text-sm text-muted-foreground">
                Volume {formatVolume(draftVolume(draft))}
              </p>
              {prs.length > 0 ? (
                <div className="space-y-1 pt-1">
                  <p className="text-sm font-medium">New PRs</p>
                  {prs.map((pr) => (
                    <p key={pr.exerciseId} className="text-sm text-muted-foreground">
                      {pr.name} · {pr.weight} kg × {pr.reps}
                    </p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={draft.notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="How did it go?"
              disabled={draft.completed}
              className="min-h-24"
            />
          </div>

          {syncStatus === "pending" || syncStatus === "failed" ? (
            <p className="text-sm text-muted-foreground" role="status">
              {syncStatus === "failed"
                ? "Sync failed — tap to retry."
                : "Pending sync. Saved on this device."}
            </p>
          ) : null}

          {pendingStart ? (
            <p className="text-sm text-muted-foreground">
              Next up: {pendingStart.name}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          {draft.completed &&
          (syncStatus === "failed" || syncStatus === "pending") ? (
            <Button
              className="h-12 w-full"
              size="lg"
              onClick={() => void handleRetry()}
              disabled={isSyncing}
            >
              {isSyncing ? "Syncing…" : "Retry sync"}
            </Button>
          ) : (
            <Button
              className="h-12 w-full"
              size="lg"
              onClick={() => void handleDone()}
              disabled={!hasConfirmed || isSyncing}
            >
              {isSyncing ? "Saving…" : "Done"}
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label="Close workout"
          onClick={handleClose}
        >
          <X className="size-5" />
        </Button>
        <h1 className="flex-1 truncate text-center text-lg font-semibold">
          {draft.name}
        </h1>
        <span className="w-11" />
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {groupExercises(
          draft.exercises.map((exercise) => ({
            ...exercise,
            supersetGroup: exercise.supersetGroup ?? null,
          })),
        ).map((block) =>
          block.kind === "superset" ? (
            <WorkoutSupersetCard
              key={block.id}
              a={block.a}
              b={block.b}
              completed={draft.completed}
            />
          ) : (
            <WorkoutExerciseCard
              key={block.id}
              exercise={block.exercise}
              completed={draft.completed}
            />
          ),
        )}

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          onClick={() => setAddExerciseOpen(true)}
        >
          <Plus className="size-4" />
          Add exercise
        </Button>
      </div>

      <div
        className="border-t bg-background px-4 pt-3"
        style={{ paddingBottom: "max(0.75rem, var(--safe-area-bottom))" }}
      >
        <Button
          className="h-12 w-full"
          size="lg"
          disabled={!hasConfirmed}
          onClick={openSummary}
        >
          Finish Workout
        </Button>
      </div>

      <Drawer
        open={addExerciseOpen}
        onOpenChange={setAddExerciseOpen}
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Add exercise</DrawerTitle>
            <DrawerDescription>
              Pick an exercise from your library.
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60dvh] space-y-2 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {(draft.exerciseCatalog ?? [])
              .filter(
                (item) =>
                  !draft.exercises.some(
                    (exercise) => exercise.exerciseId === item.exerciseId,
                  ),
              )
              .map((item) => (
                <Button
                  key={item.exerciseId}
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start"
                  onClick={() => handleSelectExercise(item)}
                >
                  {item.name}
                </Button>
              ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog
        open={adhocPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setAdhocPrompt(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Add to template?</DialogTitle>
            <DialogDescription>
              Add {adhocPrompt?.exerciseName} to {adhocPrompt?.templateName}{" "}
              template permanently?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col">
            <Button
              className="h-11 w-full"
              disabled={pending}
              onClick={handleAddToTemplate}
            >
              {pending ? "Saving…" : `Add to ${adhocPrompt?.templateName}`}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={pending}
              onClick={() => setAdhocPrompt(null)}
            >
              This workout only
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
