"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { asExerciseType } from "@/lib/content/constants";
import {
  canConfirmSet,
  formatPrevious,
  isPersonalRecordSet,
} from "@/lib/workout/helpers";
import { useWorkoutStore } from "@/lib/workout/store";
import type { DraftExercise, DraftSet } from "@/lib/workout/types";
import { cn } from "@/lib/utils";

export function WorkoutSetRow({
  exercise,
  set,
  completed,
  slotLabel,
  onOpenNumpad,
  onOpenMenu,
}: {
  exercise: DraftExercise;
  set: DraftSet;
  completed: boolean;
  slotLabel?: "A1" | "A2";
  onOpenNumpad: (setId: string, field: "weight" | "reps") => void;
  onOpenMenu: (setId: string) => void;
}) {
  const confirmSet = useWorkoutStore((state) => state.confirmSet);
  const type = asExerciseType(exercise.type);
  const weightLabel = type === "bodyweight" ? "+KG" : "KG";

  return (
    <div
      className={cn(
        "grid items-center gap-1 rounded-lg p-0.5",
        slotLabel
          ? "grid-cols-[2rem_2.5rem_3.5rem_3rem_3rem_2.75rem]"
          : "grid-cols-[2.75rem_3.75rem_3.25rem_3.25rem_2.75rem]",
        set.confirmed && "bg-primary/15",
      )}
    >
      {slotLabel ? (
        <span className="text-center text-xs font-bold text-primary">
          {slotLabel}
        </span>
      ) : null}
      <Button
        type="button"
        size="icon-lg"
        variant="ghost"
        className="relative size-11 text-base font-semibold"
        disabled={completed}
        aria-label={`Options for ${slotLabel ? `${slotLabel} ` : ""}set ${set.setIndex}`}
        onClick={() => onOpenMenu(set.id)}
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
        {formatPrevious(set.previous ?? null, type)}
      </span>

      <Input
        readOnly
        aria-label={`${exercise.name} set ${set.setIndex} ${weightLabel}`}
        value={set.weight}
        placeholder={type === "bodyweight" ? "+kg" : undefined}
        className="h-11 px-1 text-center"
        disabled={completed}
        onClick={() => onOpenNumpad(set.id, "weight")}
      />
      <Input
        readOnly
        aria-label={`${exercise.name} set ${set.setIndex} reps`}
        value={set.reps}
        className="h-11 px-1 text-center"
        disabled={completed}
        onClick={() => onOpenNumpad(set.id, "reps")}
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
          disabled={!canConfirmSet(set, type) || completed}
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
  );
}

export function WorkoutSetHeader({
  slotLabel,
  weightLabel = "KG",
}: {
  slotLabel?: boolean;
  weightLabel?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 px-0.5 text-[10px] font-medium text-muted-foreground",
        slotLabel
          ? "grid-cols-[2rem_2.5rem_3.5rem_3rem_3rem_2.75rem]"
          : "grid-cols-[2.75rem_3.75rem_3.25rem_3.25rem_2.75rem]",
      )}
    >
      {slotLabel ? <span>SS</span> : null}
      <span>SET</span>
      <span>PREVIOUS</span>
      <span>{weightLabel}</span>
      <span>REPS</span>
      <span className="sr-only">Confirm</span>
    </div>
  );
}
