"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseNameLink } from "@/components/exercises/exercise-name-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteWorkoutHistory,
  updateWorkoutHistory,
} from "@/lib/history/actions";
import {
  formatDate,
  formatDuration,
  formatSetLoad,
  formatVolume,
  parseReps,
  parseWeight,
  workoutVolume,
} from "@/lib/workout/helpers";
import { asExerciseType } from "@/lib/content/constants";
import type { WorkoutView } from "@/lib/workout/types";
import { cn } from "@/lib/utils";

type EditableSet = Omit<
  WorkoutView["exercises"][number]["sets"][number],
  "weight" | "reps"
> & {
  weight: string;
  reps: string;
};

type EditableExercise = Omit<
  WorkoutView["exercises"][number],
  "sets"
> & {
  sets: EditableSet[];
};

function toEditableExercises(workout: WorkoutView): EditableExercise[] {
  return workout.exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({
      ...set,
      weight: set.weight === null ? "" : String(set.weight),
      reps: String(set.reps),
    })),
  }));
}

export function WorkoutDetailView({ workout }: { workout: WorkoutView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [performedOn, setPerformedOn] = useState(workout.performedOn);
  const [exercises, setExercises] = useState(() =>
    toEditableExercises(workout),
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetForm() {
    setPerformedOn(workout.performedOn);
    setExercises(toEditableExercises(workout));
    setFormError(null);
  }

  function handleCancel() {
    resetForm();
    setEditing(false);
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    );
  }

  function addSet(exerciseId: string) {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const previous = exercise.sets.at(-1);
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: crypto.randomUUID(),
              setIndex: exercise.sets.length + 1,
              weight: previous?.weight ?? "",
              reps: previous?.reps ?? "",
              isWarmup: false,
              toFailure: false,
            },
          ],
        };
      }),
    );
  }

  function removeSet(exerciseId: string, setId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets
                .filter((set) => set.id !== setId)
                .map((set, index) => ({ ...set, setIndex: index + 1 })),
            }
          : exercise,
      ),
    );
  }

  function handleSave() {
    setFormError(null);

    const payloadExercises = exercises.map((exercise) => ({
      id: exercise.id,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        weight: parseWeight(set.weight),
        reps: parseReps(set.reps) ?? 0,
        is_warmup: set.isWarmup,
        to_failure: set.toFailure,
      })),
    }));

    const invalidSet = exercises
      .flatMap((exercise) => exercise.sets)
      .find((set) => {
        const reps = parseReps(set.reps);
        const weight = parseWeight(set.weight);
        return (
          reps === null || (set.weight.trim() !== "" && weight === null)
        );
      });

    if (invalidSet) {
      setFormError("Enter a valid weight and whole-number reps for every set.");
      return;
    }

    startTransition(async () => {
      const result = await updateWorkoutHistory({
        workout_id: workout.id,
        performed_on: performedOn,
        exercises: payloadExercises,
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    setFormError(null);
    startTransition(async () => {
      const result = await deleteWorkoutHistory(workout.id);
      if (result.error) {
        setDeleteOpen(false);
        setFormError(result.error);
        return;
      }
      router.push("/history");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/history"
          aria-label="Back to history"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "size-11",
          )}
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
        </div>
        {!editing ? (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-5 space-y-2">
          <Label htmlFor="workout-date">Workout date</Label>
          <Input
            id="workout-date"
            type="date"
            value={performedOn}
            onChange={(event) => setPerformedOn(event.target.value)}
            className="h-11"
            disabled={pending}
          />
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            {formatDate(workout.performedOn)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDuration(workout.startedAt, workout.finishedAt)} ·{" "}
            {formatVolume(workoutVolume(workout))}
          </p>
        </>
      )}

      {workout.notes ? (
        <p className="mt-3 text-sm">{workout.notes}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="min-w-0 truncate">
                {exercise.supersetGroup != null ? (
                  <span className="mr-2 text-primary">
                    {exercises
                      .filter(
                        (item) =>
                          item.supersetGroup === exercise.supersetGroup,
                      )
                      .sort((a, b) => a.position - b.position)
                      .findIndex((item) => item.id === exercise.id) === 0
                      ? "A1"
                      : "A2"}
                  </span>
                ) : null}
                {editing ? (
                  exercise.name
                ) : (
                  <ExerciseNameLink
                    id={exercise.exerciseId}
                    name={exercise.name}
                  />
                )}
              </CardTitle>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={pending}
                  onClick={() => addSet(exercise.id)}
                >
                  <Plus className="size-4" />
                  Add set
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {exercise.sets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sets.</p>
              ) : null}
              {exercise.sets.map((set, index) =>
                editing ? (
                  <div key={set.id} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-center text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor={`${set.id}-weight`}
                        className="sr-only"
                      >
                        Set {index + 1} weight in kilograms
                      </Label>
                      <Input
                        id={`${set.id}-weight`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.25"
                        placeholder={
                          asExerciseType(exercise.type) === "bodyweight"
                            ? "+KG"
                            : "KG"
                        }
                        value={set.weight}
                        onChange={(event) =>
                          updateSet(
                            exercise.id,
                            set.id,
                            "weight",
                            event.target.value,
                          )
                        }
                        className="h-11"
                        disabled={pending}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={`${set.id}-reps`} className="sr-only">
                        Set {index + 1} repetitions
                      </Label>
                      <Input
                        id={`${set.id}-reps`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        placeholder="REPS"
                        value={set.reps}
                        onChange={(event) =>
                          updateSet(
                            exercise.id,
                            set.id,
                            "reps",
                            event.target.value,
                          )
                        }
                        className="h-11"
                        disabled={pending}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete set ${index + 1}`}
                      className="size-11 text-destructive"
                      disabled={pending}
                      onClick={() => removeSet(exercise.id, set.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <p key={set.id} className="text-sm">
                    Set {set.setIndex}
                    <span className="ml-3 text-muted-foreground">
                      {formatSetLoad(
                        set.weight.trim() === "" ? null : Number(set.weight),
                        Number(set.reps),
                        asExerciseType(exercise.type),
                      )}
                      {set.isWarmup ? " · Warm-up" : ""}
                      {set.toFailure ? " · Failure" : ""}
                    </span>
                  </p>
                ),
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {formError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-11"
            disabled={pending || !performedOn}
            onClick={handleSave}
          >
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-8 h-11 w-full text-destructive"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          Delete workout
        </Button>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workout?</DialogTitle>
            <DialogDescription>
              This permanently deletes the workout and all of its sets. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Deleting..." : "Delete workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
