"use client";

import { useState } from "react";
import { Check, ChevronDown, Flame, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  WorkoutSetHeader,
  WorkoutSetRow,
} from "@/components/workout/workout-set-row";
import { WorkoutNumpad } from "@/components/workout/workout-numpad";
import { asExerciseType } from "@/lib/content/constants";
import {
  canConfirmSet,
  draftExerciseVolume,
  formatVolume,
} from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { DraftExercise } from "@/lib/workout/types";

type ActiveInput = {
  setId: string;
  field: "weight" | "reps";
} | null;

export function WorkoutExerciseCard({
  exercise,
  completed,
}: {
  exercise: DraftExercise;
  completed: boolean;
}) {
  const confirmSet = useWorkoutStore((state) => state.confirmSet);
  const toggleSetFlag = useWorkoutStore((state) => state.toggleSetFlag);
  const deleteSet = useWorkoutStore((state) => state.deleteSet);
  const addSet = useWorkoutStore((state) => state.addSet);
  const toggleCollapsed = useWorkoutStore(
    (state) => state.toggleExerciseCollapsed,
  );
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [menuSetId, setMenuSetId] = useState<string | null>(null);

  const type = asExerciseType(exercise.type);
  const activeSet = activeInput
    ? (exercise.sets.find((set) => set.id === activeInput.setId) ?? null)
    : null;
  const menuSet = menuSetId
    ? (exercise.sets.find((set) => set.id === menuSetId) ?? null)
    : null;

  if (exercise.collapsed) {
    const workingSets = exercise.sets.filter(
      (set) => set.confirmed && !set.isWarmup,
    ).length;
    return (
      <Card className="py-0">
        <button
          type="button"
          className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
          onClick={() => toggleCollapsed(exercise.id)}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{exercise.name}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {workingSets} working {workingSets === 1 ? "set" : "sets"} ·{" "}
              {formatVolume(draftExerciseVolume(exercise))}
            </span>
          </span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        </button>
      </Card>
    );
  }

  function changeActiveValue(value: string) {
    if (!activeInput || !activeSet) return;
    updateSet(exercise.id, activeSet.id, {
      weight: activeInput.field === "weight" ? value : activeSet.weight,
      reps: activeInput.field === "reps" ? value : activeSet.reps,
    });
  }

  function confirmFromNumpad() {
    if (!activeSet || !canConfirmSet(activeSet, type)) return;
    if (!activeSet.confirmed) confirmSet(exercise.id, activeSet.id);
    setActiveInput(null);
  }

  return (
    <Card>
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-lg">{exercise.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pt-4">
        <WorkoutSetHeader
          weightLabel={type === "bodyweight" ? "+KG" : "KG"}
        />

        {exercise.sets.map((set) => (
          <WorkoutSetRow
            key={set.id}
            exercise={exercise}
            set={set}
            completed={completed}
            onOpenNumpad={(setId, field) => setActiveInput({ setId, field })}
            onOpenMenu={setMenuSetId}
          />
        ))}

        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full"
          disabled={completed}
          onClick={() => addSet(exercise.id)}
        >
          <Plus className="size-4" />
          Add set
        </Button>
      </CardContent>

      <WorkoutNumpad
        open={activeInput !== null}
        title={`${exercise.name} · Set ${activeSet?.setIndex ?? ""}`}
        field={activeInput?.field ?? "weight"}
        value={
          activeInput?.field === "reps"
            ? (activeSet?.reps ?? "")
            : (activeSet?.weight ?? "")
        }
        canConfirm={activeSet ? canConfirmSet(activeSet, type) : false}
        weightOptional={type === "bodyweight"}
        onOpenChange={(open) => {
          if (!open) setActiveInput(null);
        }}
        onValueChange={changeActiveValue}
        onNext={() => {
          if (activeSet) {
            setActiveInput({ setId: activeSet.id, field: "reps" });
          }
        }}
        onConfirm={confirmFromNumpad}
      />

      <Drawer
        open={menuSet !== null}
        onOpenChange={(open) => {
          if (!open) setMenuSetId(null);
        }}
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {exercise.name} · Set {menuSet?.setIndex}
            </DrawerTitle>
            <DrawerDescription>Choose set options.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant={menuSet?.isWarmup ? "default" : "outline"}
              className="h-12 w-full justify-start"
              onClick={() => {
                if (menuSet) {
                  toggleSetFlag(exercise.id, menuSet.id, "isWarmup");
                }
              }}
            >
              <Flame className="size-4" />
              Warmup
            </Button>
            <Button
              type="button"
              variant={menuSet?.toFailure ? "default" : "outline"}
              className="h-12 w-full justify-start"
              onClick={() => {
                if (menuSet) {
                  toggleSetFlag(exercise.id, menuSet.id, "toFailure");
                }
              }}
            >
              <Check className="size-4" />
              To failure
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12 w-full justify-start"
              disabled={exercise.sets.length <= 1}
              onClick={() => {
                if (!menuSet) return;
                deleteSet(exercise.id, menuSet.id);
                setMenuSetId(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete set
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}
