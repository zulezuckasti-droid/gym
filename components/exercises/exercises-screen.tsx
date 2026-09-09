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
import { MUSCLE_GROUPS } from "@/lib/content/constants";
import type { ExerciseRow } from "@/lib/content/queries";
import { groupExercisesByMuscle } from "@/lib/content/grouping";

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
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
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

  function handleCreate() {
    setFormError(null);
    startTransition(async () => {
      const result = await createExercise(
        name,
        muscleGroup as (typeof MUSCLE_GROUPS)[number],
      );
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setCreateOpen(false);
      setName("");
      if (result.id) {
        router.push(`/exercises/${result.id}`);
      } else {
        router.refresh();
      }
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
          onClick={() => setCreateOpen(true)}
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
                  <Card key={exercise.id} className="py-0">
                    <CardContent className="p-0">
                      <Link
                        href={`/exercises/${exercise.id}`}
                        className="flex min-h-14 w-full items-center px-4 text-base font-medium"
                      >
                        {exercise.name}
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Name</Label>
              <Input
                id="exercise-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Exercise name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscle-group">Muscle group</Label>
              <select
                id="muscle-group"
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
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="flex-col sm:flex-col">
            <Button
              className="h-11 w-full"
              disabled={pending || !name.trim()}
              onClick={handleCreate}
            >
              {pending ? "Creating…" : "Create exercise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
