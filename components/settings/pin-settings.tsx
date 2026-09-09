"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getRememberPreference,
  hasPin,
  isValidPin,
  savePin,
  setRememberPreference,
  subscribePin,
  verifyPin,
} from "@/lib/pin";

export function PinSettings() {
  const remember = useSyncExternalStore(
    subscribePin,
    getRememberPreference,
    () => false,
  );
  const pinExists = useSyncExternalStore(subscribePin, hasPin, () => false);
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setError(null);
    setMessage(null);
    if (!isValidPin(nextPin) || nextPin !== confirmPin) {
      setError("Enter the same 4-digit PIN twice.");
      return;
    }
    if (pinExists && !(await verifyPin(currentPin))) {
      setError("Current PIN is incorrect.");
      return;
    }

    setPending(true);
    const saved = await savePin(nextPin);
    setPending(false);
    if (!saved) {
      setError("Could not save PIN.");
      return;
    }
    setCurrentPin("");
    setNextPin("");
    setConfirmPin("");
    setMessage("PIN saved.");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Privacy</p>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <Label htmlFor="remember-pin" className="text-sm font-medium">
          Remember PIN for 7 days
        </Label>
        <Switch
          id="remember-pin"
          checked={remember}
          onCheckedChange={setRememberPreference}
        />
      </div>

      <div className="space-y-3">
        {pinExists ? (
          <div className="space-y-2">
            <Label htmlFor="current-pin">Current PIN</Label>
            <Input
              id="current-pin"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(event) =>
                setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="h-11"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="new-pin">{pinExists ? "New PIN" : "PIN"}</Label>
          <Input
            id="new-pin"
            inputMode="numeric"
            maxLength={4}
            value={nextPin}
            onChange={(event) =>
              setNextPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pin">Confirm PIN</Label>
          <Input
            id="confirm-pin"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(event) =>
              setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="h-11"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
        <Button
          type="button"
          className="h-11 w-full"
          disabled={pending}
          onClick={() => void handleSave()}
        >
          {pending ? "Saving…" : pinExists ? "Change PIN" : "Set PIN"}
        </Button>
      </div>
    </div>
  );
}
