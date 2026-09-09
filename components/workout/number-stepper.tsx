"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  parseReps,
  parseWeight,
  stepNumericInput,
} from "@/lib/workout/helpers";

export function NumberStepper({
  id,
  value,
  onChange,
  step = 1,
  integer = false,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  inputMode,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  integer?: boolean;
  placeholder?: string;
  disabled?: boolean;
  "aria-label": string;
  inputMode?: "decimal" | "numeric";
}) {
  const current = integer ? (parseReps(value) ?? 0) : (parseWeight(value) ?? 0);
  const unit = integer ? "rep" : "kilogram";

  return (
    <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-input bg-input/30">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11 shrink-0 rounded-none"
        aria-label={`Decrease ${ariaLabel} by 1 ${unit}`}
        disabled={disabled || current <= 0}
        onClick={() => onChange(stepNumericInput(value, -step, { integer }))}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        id={id}
        inputMode={inputMode ?? (integer ? "numeric" : "decimal")}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-center tabular-nums dark:bg-transparent"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11 shrink-0 rounded-none"
        aria-label={`Increase ${ariaLabel} by 1 ${unit}`}
        disabled={disabled}
        onClick={() => onChange(stepNumericInput(value, step, { integer }))}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
