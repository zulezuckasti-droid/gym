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
import { Input } from "@/components/ui/input";
import { WorkoutNumpad } from "@/components/workout/workout-numpad";
import {
  canConfirmSet,
  draftExerciseVolume,
  formatPrevious,
  formatVolume,
  isPersonalRecordSet,
} from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { DraftExercise } from "@/lib/workout/types";
import { cn } from "@/lib/utils";

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
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const confirmSet = useWorkoutStore((state) => state.confirmSet);
  const toggleSetFlag = useWorkoutStore((state) => state.toggleSetFlag);
  const deleteSet = useWorkoutStore((state) => state.deleteSet);
  const addSet = useWorkoutStore((state) => state.addSet);
  const toggleCollapsed = useWorkoutStore(
    (state) => state.toggleExerciseCollapsed,
  );
  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [menuSetId, setMenuSetId] = useState<string | null>(null);

  const activeSet = activeInput
    ? exercise.sets.find((set) => set.id === activeInput.setId) ?? null
    : null;
  const menuSet = menuSetId
    ? exercise.sets.find((set) => set.id === menuSetId) ?? null
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
    if (!activeSet || !canConfirmSet(activeSet)) return;
    if (!activeSet.confirmed) confirmSet(exercise.id, activeSet.id);
    setActiveInput(null);
  }

  return (
    <Card>
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-lg">{exercise.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pt-4">
        <div className="grid grid-cols-[2.75rem_3.75rem_3.25rem_3.25rem_2.75rem] gap-1 px-0.5 text-[10px] font-medium text-muted-foreground">
          <span>SET</span>
          <span>PREVIOUS</span>
          <span>KG</span>
          <span>REPS</span>
          <span className="sr-only">Confirm</span>
        </div>

        {exercise.sets.map((set) => (
          <div
            key={set.id}
            className={cn(
              "grid grid-cols-[2.75rem_3.75rem_3.25rem_3.25rem_2.75rem] items-center gap-1 rounded-lg p-0.5",
              set.confirmed && "bg-primary/15",
            )}
          >
            <Button
              type="button"
              size="icon-lg"
              variant="ghost"
              className="relative size-11 text-base font-semibold"
              disabled={completed}
              aria-label={`Options for set ${set.setIndex}`}
              onClick={() => setMenuSetId(set.id)}
            >
              {set.setIndex}
              {set.isWarmup || set.toFailure ? (
                <span className="absolute right-0.5 bottom-0.5 text-[9px] leading-none text-primary">
                  {set.isWarmup ? "W" : ""}
                  {set.toFailure ? "F" : ""}
                </span>
              ) : null}
            </Button>

            <span className="truncate text-[10px] leading-tight text-muted-foreground">
              {formatPrevious(set.previous ?? null)}
            </span>

            <Input
              readOnly
              aria-label={`${exercise.name} set ${set.setIndex} kilograms`}
              value={set.weight}
              className="h-11 px-1 text-center"
              disabled={completed}
              onClick={() =>
                setActiveInput({ setId: set.id, field: "weight" })
              }
            />
            <Input
              readOnly
              aria-label={`${exercise.name} set ${set.setIndex} reps`}
              value={set.reps}
              className="h-11 px-1 text-center"
              disabled={completed}
              onClick={() => setActiveInput({ setId: set.id, field: "reps" })}
            />
            <div className="relative">
              <Button
                type="button"
                size="icon-lg"
                variant={set.confirmed ? "default" : "outline"}
                className="size-11"
                aria-label={
                  set.confirmed
                    ? `Unconfirm set ${set.setIndex}`
                    : `Confirm set ${set.setIndex}`
                }
                disabled={!canConfirmSet(set) || completed}
                onClick={() => confirmSet(exercise.id, set.id)}
              >
                <Check className="size-5" />
              </Button>
              {isPersonalRecordSet(exercise, set) ? (
                <span className="absolute -top-2 -right-1 rounded bg-amber-400 px-1 text-[9px] font-bold text-black">
                  PR
                </span>
              ) : null}
            </div>
          </div>
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
        canConfirm={activeSet ? canConfirmSet(activeSet) : false}
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
