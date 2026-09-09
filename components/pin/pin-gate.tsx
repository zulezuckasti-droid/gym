"use client";

import { useState, useSyncExternalStore } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPinSnapshot,
  isValidPin,
  markPinRemembered,
  savePin,
  subscribePin,
  verifyPin,
} from "@/lib/pin";

type Mode = "setup" | "confirm" | "unlock";

export function PinGate({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribePin,
    getPinSnapshot,
    () => "pending",
  );
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [mode, setMode] = useState<Mode>(
    snapshot === "setup" ? "setup" : "unlock",
  );
  const [pendingPin, setPendingPin] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unlocked = snapshot === "remembered" || sessionUnlocked;
  const effectiveMode: Mode =
    mode === "confirm" ? "confirm" : snapshot === "setup" ? "setup" : "unlock";

  async function submit(pin: string) {
    setError(null);
    if (!isValidPin(pin)) return;

    if (effectiveMode === "setup") {
      setPendingPin(pin);
      setValue("");
      setMode("confirm");
      return;
    }

    if (effectiveMode === "confirm") {
      if (pin !== pendingPin) {
        setError("PINs did not match. Try again.");
        setPendingPin("");
        setValue("");
        setMode("setup");
        return;
      }
      await savePin(pin);
      setSessionUnlocked(true);
      return;
    }

    const ok = await verifyPin(pin);
    if (!ok) {
      setError("Incorrect PIN.");
      setValue("");
      return;
    }
    markPinRemembered();
    setSessionUnlocked(true);
  }

  function append(digit: string) {
    if (value.length >= 4) return;
    const next = `${value}${digit}`;
    setValue(next);
    if (next.length === 4) {
      void submit(next);
    }
  }

  if (snapshot === "pending") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (unlocked) {
    return children;
  }

  const title =
    effectiveMode === "setup"
      ? "Create a PIN"
      : effectiveMode === "confirm"
        ? "Confirm PIN"
        : "Enter PIN";
  const description =
    effectiveMode === "setup"
      ? "A 4-digit PIN locks the app on this device."
      : effectiveMode === "confirm"
        ? "Enter the same PIN once more."
        : "This lock stays on the device. Your data is still protected by your account.";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {description}
        </p>

        <div className="mt-10 flex justify-center gap-3">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="flex size-4 items-center justify-center"
            >
              <span
                className={`size-3 rounded-full ${
                  value.length > index ? "bg-primary" : "bg-muted"
                }`}
              />
            </span>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-4 h-5" />
        )}

        <div className="mt-auto grid grid-cols-3 gap-3 pb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Button
              key={digit}
              type="button"
              variant="outline"
              className="h-16 text-xl"
              onClick={() => append(digit)}
            >
              {digit}
            </Button>
          ))}
          <span />
          <Button
            type="button"
            variant="outline"
            className="h-16 text-xl"
            onClick={() => append("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-16"
            aria-label="Backspace"
            onClick={() => setValue((current) => current.slice(0, -1))}
          >
            <Delete className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
