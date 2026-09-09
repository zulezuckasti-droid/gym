"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExercise } from "@/lib/content/actions";
import {
  asExerciseType,
  EXERCISE_TYPES,
  exerciseTypeLabel,
  MUSCLE_GROUPS,
  type ExerciseType,
} from "@/lib/content/constants";
import type { ExerciseRow } from "@/lib/content/queries";
import { groupExercisesByMuscle } from "@/lib/content/grouping";
import { commitIme, formText, nameFieldProps } from "@/lib/form/live-text";
import { cn, pressableClass } from "@/lib/utils";

export function ExercisesScreen({
  exercises,
  error,
}: {
  exercises: ExerciseRow[];
  error: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("weight_reps");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;
    return exercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.muscle_group.toLowerCase().includes(normalized),
    );
  }, [exercises, query]);

  const grouped = useMemo(
    () => groupExercisesByMuscle(filtered),
    [filtered],
  );

  function resetCreateForm() {
    setMuscleGroup(MUSCLE_GROUPS[0]);
    setExerciseType("weight_reps");
    setFormError(null);
    setFormKey((key) => key + 1);
  }

  function handleCreate(form: HTMLFormElement) {
    commitIme();
    const submittedName = formText(form, "name").trim();
    const submittedGroup =
      formText(form, "muscleGroup") || muscleGroup;
    const submittedType = asExerciseType(
      formText(form, "exerciseType") || exerciseType,
    );
    setFormError(null);
    if (!submittedName) {
      setFormError("Exercise name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createExercise(
        submittedName,
        submittedGroup as (typeof MUSCLE_GROUPS)[number],
        submittedType,
      );
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setCreateOpen(false);
      resetCreateForm();
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => {
            resetCreateForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercises"
          className="h-11 pl-9"
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-6 pb-4">
        {filtered.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">No exercises found.</p>
        ) : (
          [...grouped.entries()].map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {group}
              </h2>
              <div className="space-y-2">
                {items.map((exercise) => (
                  <Card key={exercise.id} className={cn("py-0", pressableClass)}>
                    <CardContent className="p-0">
                      <Link
                        href={`/exercises/${exercise.id}`}
                        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-base font-medium"
                      >
                        <span className="truncate">{exercise.name}</span>
                        {asExerciseType(exercise.type) === "bodyweight" ? (
                          <span className="shrink-0 text-xs font-normal text-muted-foreground">
                            BW
                          </span>
                        ) : null}
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (open && !createOpen) {
            resetCreateForm();
          }
          setCreateOpen(open);
        }}
      >
        <DialogContent>
          <form
            key={formKey}
            onSubmit={(event) => {
              event.preventDefault();
              handleCreate(event.currentTarget);
            }}
          >
            <DialogHeader>
              <DialogTitle>New exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise-name">Name</Label>
                <Input
                  id="exercise-name"
                  name="name"
                  defaultValue=""
                  placeholder="Exercise name"
                  className="h-11"
                  autoFocus
                  {...nameFieldProps}
                />
              </div>
            <div className="space-y-2">
              <Label htmlFor="muscle-group">Muscle group</Label>
              <select
                id="muscle-group"
                name="muscleGroup"
                value={muscleGroup}
                onChange={(event) => setMuscleGroup(event.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise-type">Type</Label>
              <select
                id="exercise-type"
                name="exerciseType"
                value={exerciseType}
                onChange={(event) =>
                  setExerciseType(asExerciseType(event.target.value))
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                {EXERCISE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {exerciseTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            </div>
            <DialogFooter className="flex-col sm:flex-col">
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={pending}
              >
                {pending ? "Creating…" : "Create exercise"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
