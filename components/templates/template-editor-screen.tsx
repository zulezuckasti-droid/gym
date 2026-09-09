"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronLeft,
  GripVertical,
  Link2,
  Link2Off,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { SortableItem } from "@/components/dnd/sortable-item";
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
  pairTemplateExercises,
  removeExerciseFromTemplate,
  renameTemplate,
  reorderTemplateExercises,
  unpairTemplateSuperset,
  updateTemplateExerciseSets,
} from "@/lib/content/actions";
import { asExerciseType, exerciseTypeLabel } from "@/lib/content/constants";
import type { ExerciseRow, TemplateDetail } from "@/lib/content/queries";
import { commitIme, nameFieldProps } from "@/lib/form/live-text";
import { flattenBlocks, groupExercises } from "@/lib/workout/grouping";
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
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

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

  const blocks = useMemo(
    () =>
      template
        ? groupExercises(
            template.exercises.map((item) => ({
              ...item,
              supersetGroup: item.supersetGroup ?? null,
            })),
          )
        : [],
    [template],
  );

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
    commitIme();
    const submittedName = (nameInputRef.current?.value ?? "").trim();
    setFormError(null);
    if (!submittedName) {
      setFormError("Template name is required.");
      return;
    }
    startTransition(async () => {
      const result = await renameTemplate(current.id, submittedName);
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

  function handlePair(firstId: string, secondId: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await pairTemplateExercises(current.id, firstId, secondId);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleUnpair(group: number) {
    setFormError(null);
    startTransition(async () => {
      const result = await unpairTemplateSuperset(current.id, group);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(blocks, oldIndex, newIndex);
    const orderedIds = flattenBlocks(next).map((item) => item.id);
    startTransition(async () => {
      const result = await reorderTemplateExercises(current.id, orderedIds);
      if (result.error) {
        setFormError(result.error);
        return;
      }
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
              key={current.id}
              ref={nameInputRef}
              defaultValue={current.name}
              className="h-11"
              {...nameFieldProps}
            />
            <Button
              type="button"
              className="h-11 shrink-0"
              disabled={pending}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {blocks.map((block, index) => {
                    const next = blocks[index + 1];
                    const canPair =
                      block.kind === "single" && next?.kind === "single";

                    return (
                      <SortableItem key={block.id} id={block.id}>
                        {(handleProps) => (
                          <div className="rounded-xl border px-3 py-3">
                            <div className="flex items-start gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-1 size-10 shrink-0 touch-none"
                                aria-label="Reorder"
                                disabled={pending}
                                {...handleProps}
                              >
                                <GripVertical className="size-4" />
                              </Button>
                              <div className="min-w-0 flex-1 space-y-3">
                                {block.kind === "superset" ? (
                                  <>
                                    <ExerciseEditorRow
                                      item={block.a}
                                      slot="A1"
                                      pending={pending}
                                      onSetChange={handleSetChange}
                                      onRemove={handleRemove}
                                    />
                                    <ExerciseEditorRow
                                      item={block.b}
                                      slot="A2"
                                      pending={pending}
                                      onSetChange={handleSetChange}
                                      onRemove={handleRemove}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="h-10 w-full"
                                      disabled={pending}
                                      onClick={() => handleUnpair(block.group)}
                                    >
                                      <Link2Off className="size-4" />
                                      Unpair superset
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <ExerciseEditorRow
                                      item={block.exercise}
                                      pending={pending}
                                      onSetChange={handleSetChange}
                                      onRemove={handleRemove}
                                    />
                                    {canPair && next.kind === "single" ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-10 w-full"
                                        disabled={pending}
                                        onClick={() =>
                                          handlePair(
                                            block.exercise.id,
                                            next.exercise.id,
                                          )
                                        }
                                      >
                                        <Link2 className="size-4" />
                                        Superset with next
                                      </Button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </SortableItem>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
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
                  <span className="min-w-0 flex-1 truncate text-left">
                    {exercise.name}
                  </span>
                  {asExerciseType(exercise.type) === "bodyweight" ? (
                    <span className="text-xs text-muted-foreground">BW</span>
                  ) : null}
                </Button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}

function ExerciseEditorRow({
  item,
  slot,
  pending,
  onSetChange,
  onRemove,
}: {
  item: TemplateDetail["exercises"][number];
  slot?: "A1" | "A2";
  pending: boolean;
  onSetChange: (id: string, targetSets: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {slot ? (
            <span className="mr-2 text-primary">{slot}</span>
          ) : null}
          <ExerciseNameLink id={item.exerciseId} name={item.name} />
        </p>
        <p className="text-sm text-muted-foreground">
          Working sets
          {asExerciseType(item.type) === "bodyweight"
            ? ` · ${exerciseTypeLabel("bodyweight")}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          disabled={pending || item.targetSets <= 1}
          onClick={() => onSetChange(item.id, item.targetSets - 1)}
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
          onClick={() => onSetChange(item.id, item.targetSets + 1)}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 text-destructive"
          disabled={pending}
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
