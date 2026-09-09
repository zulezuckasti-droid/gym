"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { ExerciseNameLink } from "@/components/exercises/exercise-name-link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addExerciseToTemplate,
  archiveTemplate,
  removeExerciseFromTemplate,
  renameTemplate,
  updateTemplateExerciseSets,
} from "@/lib/content/actions";
import type { ExerciseRow, TemplateDetail } from "@/lib/content/queries";
import { cn } from "@/lib/utils";

export function TemplateEditorScreen({
  template,
  exercises,
  error,
}: {
  template: TemplateDetail | null;
  exercises: ExerciseRow[];
  error: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(template?.name ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const availableExercises = useMemo(() => {
    if (!template) return [];
    const used = new Set(template.exercises.map((item) => item.exerciseId));
    return exercises.filter((exercise) => !used.has(exercise.id));
  }, [exercises, template]);

  const filteredAvailableExercises = useMemo(() => {
    const normalized = addSearchQuery.trim().toLowerCase();
    if (!normalized) return availableExercises;
    return availableExercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.muscle_group.toLowerCase().includes(normalized),
    );
  }, [addSearchQuery, availableExercises]);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <p className="text-sm text-muted-foreground">Template not found.</p>
        <Link
          href="/templates"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11")}
        >
          Back to templates
        </Link>
      </main>
    );
  }

  const current = template;

  function handleSaveName() {
    setFormError(null);
    startTransition(async () => {
      const result = await renameTemplate(current.id, name);
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
      const result = await archiveTemplate(current.id);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.push("/templates");
      router.refresh();
    });
  }

  function handleAddExercise(exerciseId: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await addExerciseToTemplate(current.id, exerciseId);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setAddOpen(false);
      setAddSearchQuery("");
      router.refresh();
    });
  }

  function handleRemove(templateExerciseId: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await removeExerciseFromTemplate(
        templateExerciseId,
        current.id,
      );
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSetChange(templateExerciseId: string, targetSets: number) {
    startTransition(async () => {
      await updateTemplateExerciseSets(
        templateExerciseId,
        current.id,
        targetSets,
      );
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <div className="flex items-center gap-2">
        <Link
          href="/templates"
          aria-label="Back to templates"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "size-11",
          )}
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight">
          Edit template
        </h1>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11"
            />
            <Button
              type="button"
              className="h-11 shrink-0"
              disabled={pending || !name.trim()}
              onClick={handleSaveName}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Exercises
            </h2>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          {current.exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exercises yet. Add some from your library.
            </p>
          ) : (
            current.exercises.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    <ExerciseNameLink id={item.exerciseId} name={item.name} />
                  </p>
                  <p className="text-sm text-muted-foreground">Working sets</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10"
                    disabled={pending || item.targetSets <= 1}
                    onClick={() =>
                      handleSetChange(item.id, item.targetSets - 1)
                    }
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.targetSets}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10"
                    disabled={pending}
                    onClick={() =>
                      handleSetChange(item.id, item.targetSets + 1)
                    }
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 text-destructive"
                    disabled={pending}
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pb-4 pt-8">
        <Button
          variant="outline"
          className="h-11 w-full text-destructive"
          disabled={pending}
          onClick={handleArchive}
        >
          Archive template
        </Button>
      </div>

      <Drawer
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setAddSearchQuery("");
        }}
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Add exercise</DrawerTitle>
            <DrawerDescription>
              Pick an exercise from your library.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={addSearchQuery}
                onChange={(event) => setAddSearchQuery(event.target.value)}
                placeholder="Search exercises"
                className="h-11 pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[60dvh] space-y-2 overflow-y-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {availableExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All exercises are already in this template.
              </p>
            ) : filteredAvailableExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exercises found.</p>
            ) : (
              filteredAvailableExercises.map((exercise) => (
                <Button
                  key={exercise.id}
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start"
                  disabled={pending}
                  onClick={() => handleAddExercise(exercise.id)}
                >
                  {exercise.name}
                </Button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
