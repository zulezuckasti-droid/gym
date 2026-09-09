"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseProgressSection } from "@/components/exercises/exercise-progress-section";
import { archiveExercise, renameExercise } from "@/lib/content/actions";
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
  const [name, setName] = useState(exercise?.name ?? "");
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

  function handleSave() {
    setFormError(null);
    startTransition(async () => {
      const result = await renameExercise(item.id, name);
      if (result.error) {
        setFormError(result.error);
        return;
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

      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Manage</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Muscle group</p>
          <p className="text-sm font-medium">{item.muscle_group}</p>
        </div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 pt-8 pb-4">
        <Button
          className="h-11 w-full"
          disabled={pending || !name.trim() || name.trim() === item.name}
          onClick={handleSave}
        >
          {pending ? "Saving…" : "Save name"}
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full text-destructive"
          disabled={pending}
          onClick={handleArchive}
        >
          Archive exercise
        </Button>
      </div>
    </main>
  );
}
