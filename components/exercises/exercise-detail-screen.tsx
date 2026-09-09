"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseProgressSection } from "@/components/exercises/exercise-progress-section";
import { archiveExercise, renameExercise, updateExerciseType } from "@/lib/content/actions";
import {
  asExerciseType,
  EXERCISE_TYPES,
  exerciseTypeLabel,
} from "@/lib/content/constants";
import { commitIme, formText, nameFieldProps } from "@/lib/form/live-text";
import type { ExerciseRow } from "@/lib/content/queries";
import type { ExerciseProgressData } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

export function ExerciseDetailScreen({
  exercise,
  progress,
  error,
}: {
  exercise: ExerciseRow | null;
  progress: ExerciseProgressData;
  error: string | null;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!exercise) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <p className="text-sm text-muted-foreground">Exercise not found.</p>
        <Link
          href="/exercises"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11")}
        >
          Back to exercises
        </Link>
      </main>
    );
  }

  const item = exercise;
  const savedType = asExerciseType(item.type);

  function handleSave(form: HTMLFormElement) {
    commitIme();
    const liveName = formText(form, "name").trim();
    const liveType = asExerciseType(formText(form, "exerciseType"));
    setFormError(null);
    if (!liveName) {
      setFormError("Exercise name is required.");
      return;
    }

    startTransition(async () => {
      if (liveName !== item.name) {
        const renameResult = await renameExercise(item.id, liveName);
        if (renameResult.error) {
          setFormError(renameResult.error);
          return;
        }
      }

      if (liveType !== savedType) {
        const typeResult = await updateExerciseType(item.id, liveType);
        if (typeResult.error) {
          setFormError(typeResult.error);
          return;
        }
      }

      router.refresh();
    });
  }

  function handleArchive() {
    setFormError(null);
    startTransition(async () => {
      const result = await archiveExercise(item.id);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.push("/exercises");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/exercises"
          aria-label="Back to exercises"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "size-11",
          )}
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight">
          {item.name}
        </h1>
      </div>

      <ExerciseProgressSection
        pr={progress.pr}
        maxWeight={progress.maxWeight}
        history={progress.history}
      />

      {progress.error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {progress.error}
        </p>
      ) : null}

      <form
        key={item.id}
        className="mt-8 flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave(event.currentTarget);
        }}
      >
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Manage</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            key={item.id}
            defaultValue={item.name}
            className="h-11"
            {...nameFieldProps}
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Muscle group</p>
          <p className="text-sm font-medium">{item.muscle_group}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-type">Type</Label>
          <select
            id="exercise-type"
            name="exerciseType"
            defaultValue={savedType}
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

      <div className="mt-auto space-y-3 pt-8 pb-4">
        <Button
          type="submit"
          className="h-11 w-full"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full text-destructive"
          disabled={pending}
          onClick={handleArchive}
        >
          Archive exercise
        </Button>
      </div>
      </form>
    </main>
  );
}
