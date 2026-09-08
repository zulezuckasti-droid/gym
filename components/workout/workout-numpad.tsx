"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type WorkoutNumpadProps = {
  open: boolean;
  title: string;
  field: "weight" | "reps";
  value: string;
  canConfirm: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onNext: () => void;
  onConfirm: () => void;
};

export function WorkoutNumpad({
  open,
  title,
  field,
  value,
  canConfirm,
  onOpenChange,
  onValueChange,
  onNext,
  onConfirm,
}: WorkoutNumpadProps) {
  function append(key: string) {
    if (key === "." && (field === "reps" || value.includes("."))) return;
    if (value === "0" && key !== ".") {
      onValueChange(key);
      return;
    }
    onValueChange(`${value}${key}`);
  }

  function changeWeight(delta: number) {
    const current = Number(value.replace(",", ".")) || 0;
    onValueChange(String(Math.max(0, current + delta)));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pb-3 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            {field === "weight" ? "Enter kilograms" : "Enter repetitions"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 rounded-xl bg-muted px-4 py-3 text-center text-3xl font-semibold tabular-nums">
            {value || "0"}
          </div>

          {field === "weight" ? (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11"
                onClick={() => changeWeight(-2.5)}
              >
                −2.5
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11"
                onClick={() => changeWeight(2.5)}
              >
                +2.5
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
              (key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  className="h-12 text-lg"
                  onClick={() => append(key)}
                >
                  {key}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              className="h-12 text-lg"
              disabled={field === "reps"}
              onClick={() => append(".")}
            >
              .
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 text-lg"
              onClick={() => append("0")}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              aria-label="Backspace"
              onClick={() => onValueChange(value.slice(0, -1))}
            >
              <Delete className="size-5" />
            </Button>
          </div>

          <Button
            type="button"
            className="mt-3 h-12 w-full"
            disabled={field === "reps" && !canConfirm}
            onClick={field === "weight" ? onNext : onConfirm}
          >
            {field === "weight" ? "Next" : "Confirm set"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
