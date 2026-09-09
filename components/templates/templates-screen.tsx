"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
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
import { GripVertical, Plus } from "lucide-react";
import { SortableItem } from "@/components/dnd/sortable-item";
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
import { createTemplate, reorderTemplates } from "@/lib/content/actions";
import type { TemplateListItem } from "@/lib/content/queries";
import { commitIme, formText, nameFieldProps } from "@/lib/form/live-text";

export function TemplatesScreen({
  templates,
  error,
}: {
  templates: TemplateListItem[];
  error: string | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const items = useMemo(() => templates.map((item) => item.id), [templates]);

  function handleCreate(form: HTMLFormElement) {
    commitIme();
    const submittedName = formText(form, "name").trim();
    setFormError(null);
    if (!submittedName) {
      setFormError("Template name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createTemplate(submittedName);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setCreateOpen(false);
      setFormKey((key) => key + 1);
      if (result.id) {
        router.push(`/templates/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = templates.findIndex((item) => item.id === active.id);
    const newIndex = templates.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const orderedIds = arrayMove(templates, oldIndex, newIndex).map(
      (item) => item.id,
    );
    startTransition(async () => {
      const result = await reorderTemplates(orderedIds);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New
        </Button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-6 space-y-3 pb-4">
        {templates.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            No templates yet. Create one to get started.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {templates.map((template) => (
                  <SortableItem key={template.id} id={template.id}>
                    {(handleProps) => (
                      <Card className="py-0">
                        <CardContent className="flex items-center p-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-1 size-11 shrink-0 touch-none"
                            aria-label={`Reorder ${template.name}`}
                            disabled={pending}
                            {...handleProps}
                          >
                            <GripVertical className="size-4" />
                          </Button>
                          <Link
                            href={`/templates/${template.id}`}
                            className="flex min-h-16 min-w-0 flex-1 items-center justify-between py-2 pr-5 text-left"
                          >
                            <span className="truncate text-lg font-semibold">
                              {template.name}
                            </span>
                            <span className="ml-3 shrink-0 text-sm text-muted-foreground">
                              {template.exerciseCount}{" "}
                              {template.exerciseCount === 1
                                ? "exercise"
                                : "exercises"}
                            </span>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form
            key={formKey}
            onSubmit={(event) => {
              event.preventDefault();
              handleCreate(event.currentTarget);
            }}
          >
          <DialogHeader>
            <DialogTitle>New template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              name="name"
              defaultValue=""
              placeholder="Push, Pull, Legs…"
              className="h-11"
              {...nameFieldProps}
            />
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
              {pending ? "Creating…" : "Create template"}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
