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
import { cn, pressableClass } from "@/lib/utils";

type ActiveInput = {
  exerciseId: string;
  setId: string;
  field: "weight" | "reps";
} | null;

type MenuTarget = {
  exercise: DraftExercise;
  setId: string;
} | null;

function interleaveSets(a: DraftExercise, b: DraftExercise) {
  const rows: Array<{ exercise: DraftExercise; slot: "A1" | "A2"; setIndex: number }> =
    [];
  const max = Math.max(a.sets.length, b.sets.length);
  for (let index = 0; index < max; index += 1) {
    if (a.sets[index]) {
      rows.push({ exercise: a, slot: "A1", setIndex: index });
    }
    if (b.sets[index]) {
      rows.push({ exercise: b, slot: "A2", setIndex: index });
    }
  }
  return rows;
}

export function WorkoutSupersetCard({
  a,
  b,
  completed,
}: {
  a: DraftExercise;
  b: DraftExercise;
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
  const [menu, setMenu] = useState<MenuTarget>(null);

  const collapsed = a.collapsed && b.collapsed;
  const activeExercise = activeInput
    ? activeInput.exerciseId === a.id
      ? a
      : b
    : null;
  const activeSet = activeExercise
    ? (activeExercise.sets.find((set) => set.id === activeInput?.setId) ?? null)
    : null;
  const menuSet = menu
    ? (menu.exercise.sets.find((set) => set.id === menu.setId) ?? null)
    : null;

  if (collapsed) {
    const workingSets =
      a.sets.filter((set) => set.confirmed && !set.isWarmup).length +
      b.sets.filter((set) => set.confirmed && !set.isWarmup).length;
    return (
      <Card className={cn("py-0", pressableClass)}>
        <button
          type="button"
          className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
          onClick={() => {
            toggleCollapsed(a.id);
            toggleCollapsed(b.id);
          }}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              A1 {a.name} · A2 {b.name}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {workingSets} working {workingSets === 1 ? "set" : "sets"} ·{" "}
              {formatVolume(draftExerciseVolume(a) + draftExerciseVolume(b))}
            </span>
          </span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-150" />
        </button>
      </Card>
    );
  }

  function changeActiveValue(value: string) {
    if (!activeInput || !activeSet || !activeExercise) return;
    updateSet(activeExercise.id, activeSet.id, {
      weight: activeInput.field === "weight" ? value : activeSet.weight,
      reps: activeInput.field === "reps" ? value : activeSet.reps,
    });
  }

  function confirmFromNumpad() {
    if (!activeSet || !activeExercise) return;
    if (!canConfirmSet(activeSet, asExerciseType(activeExercise.type))) return;
    if (!activeSet.confirmed) confirmSet(activeExercise.id, activeSet.id);
    setActiveInput(null);
  }

  return (
    <Card>
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-lg">
          <span className="text-primary">A1</span> {a.name}
        </CardTitle>
        <p className="text-lg font-semibold">
          <span className="text-primary">A2</span> {b.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 px-2 pt-4">
        <WorkoutSetHeader slotLabel />

        {interleaveSets(a, b).map((row) => {
          const set = row.exercise.sets[row.setIndex];
          return (
            <WorkoutSetRow
              key={set.id}
              exercise={row.exercise}
              set={set}
              completed={completed}
              slotLabel={row.slot}
              onOpenNumpad={(setId, field) =>
                setActiveInput({
                  exerciseId: row.exercise.id,
                  setId,
                  field,
                })
              }
              onOpenMenu={(setId) =>
                setMenu({ exercise: row.exercise, setId })
              }
            />
          );
        })}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={completed}
            onClick={() => addSet(a.id)}
          >
            <Plus className="size-4" />
            Add A1
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={completed}
            onClick={() => addSet(b.id)}
          >
            <Plus className="size-4" />
            Add A2
          </Button>
        </div>
      </CardContent>

      <WorkoutNumpad
        open={activeInput !== null}
        title={`${activeExercise?.name ?? ""} · Set ${activeSet?.setIndex ?? ""}`}
        field={activeInput?.field ?? "weight"}
        value={
          activeInput?.field === "reps"
            ? (activeSet?.reps ?? "")
            : (activeSet?.weight ?? "")
        }
        canConfirm={
          activeSet && activeExercise
            ? canConfirmSet(activeSet, asExerciseType(activeExercise.type))
            : false
        }
        weightOptional={asExerciseType(activeExercise?.type) === "bodyweight"}
        onOpenChange={(open) => {
          if (!open) setActiveInput(null);
        }}
        onValueChange={changeActiveValue}
        onNext={() => {
          if (activeInput) {
            setActiveInput({ ...activeInput, field: "reps" });
          }
        }}
        onConfirm={confirmFromNumpad}
      />

      <Drawer
        open={menu !== null}
        onOpenChange={(open) => {
          if (!open) setMenu(null);
        }}
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {menu?.exercise.name} · Set {menuSet?.setIndex}
            </DrawerTitle>
            <DrawerDescription>Choose set options.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant={menuSet?.isWarmup ? "default" : "outline"}
              className="h-12 w-full justify-start"
              onClick={() => {
                if (menu && menuSet) {
                  toggleSetFlag(menu.exercise.id, menuSet.id, "isWarmup");
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
                if (menu && menuSet) {
                  toggleSetFlag(menu.exercise.id, menuSet.id, "toFailure");
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
              disabled={(menu?.exercise.sets.length ?? 0) <= 1}
              onClick={() => {
                if (!menu || !menuSet) return;
                deleteSet(menu.exercise.id, menuSet.id);
                setMenu(null);
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
