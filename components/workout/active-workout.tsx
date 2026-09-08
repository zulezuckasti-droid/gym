"use client";

import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  canConfirmSet,
  draftHasConfirmedSet,
  draftVolume,
  formatDuration,
  formatVolume,
} from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import { cn } from "@/lib/utils";

export function ActiveWorkout({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const draft = useWorkoutStore((state) => state.draft);
  const syncStatus = useWorkoutStore((state) => state.syncStatus);
  const pendingStart = useWorkoutStore((state) => state.pendingStart);
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const confirmSet = useWorkoutStore((state) => state.confirmSet);
  const setNotes = useWorkoutStore((state) => state.setNotes);
  const openSummary = useWorkoutStore((state) => state.openSummary);
  const closeSummary = useWorkoutStore((state) => state.closeSummary);
  const finishAndSync = useWorkoutStore((state) => state.finishAndSync);
  const retryQueue = useWorkoutStore((state) => state.retryQueue);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const clearDraft = useWorkoutStore((state) => state.clearDraft);
  const setPendingStart = useWorkoutStore((state) => state.setPendingStart);

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
      const nextId = startWorkout(state.pendingStart);
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
        const nextId = startWorkout(state.pendingStart);
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
        {draft.exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">{exercise.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 px-0.5 text-xs font-medium text-muted-foreground">
                <span>SET</span>
                <span>KG</span>
                <span>REPS</span>
                <span className="sr-only">Confirm</span>
              </div>
              {exercise.sets.map((set) => (
                <div
                  key={set.id}
                  className={cn(
                    "grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 rounded-lg p-1",
                    set.confirmed && "bg-primary/15",
                  )}
                >
                  <span className="text-center text-base font-semibold text-muted-foreground">
                    {set.setIndex}
                  </span>
                  <Input
                    inputMode="decimal"
                    aria-label={`${exercise.name} set ${set.setIndex} kilograms`}
                    value={set.weight}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, {
                        weight: event.target.value,
                        reps: set.reps,
                      })
                    }
                    className="h-11 text-center"
                    disabled={draft.completed}
                  />
                  <Input
                    inputMode="numeric"
                    aria-label={`${exercise.name} set ${set.setIndex} reps`}
                    value={set.reps}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, {
                        weight: set.weight,
                        reps: event.target.value,
                      })
                    }
                    className="h-11 text-center"
                    disabled={draft.completed}
                  />
                  <Button
                    size="icon-lg"
                    variant={set.confirmed ? "default" : "outline"}
                    className="size-11"
                    aria-label={
                      set.confirmed
                        ? `Unconfirm set ${set.setIndex}`
                        : `Confirm set ${set.setIndex}`
                    }
                    disabled={!canConfirmSet(set) || draft.completed}
                    onClick={() => confirmSet(exercise.id, set.id)}
                  >
                    <Check className="size-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
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
    </main>
  );
}
