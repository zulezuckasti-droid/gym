const PIN_STORAGE_KEY = "gym-pin-v1";
const PIN_REMEMBER_PREF_KEY = "gym-pin-remember";
const PIN_REMEMBER_UNTIL_KEY = "gym-pin-remember-until";
const PIN_CHANGE_EVENT = "gym-pin-changed";
const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;

type StoredPin = {
  hash: string;
  salt: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function notifyPinChanged() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(PIN_CHANGE_EVENT));
}

export function subscribePin(onStoreChange: () => void) {
  if (!canUseStorage()) return () => undefined;
  window.addEventListener(PIN_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(PIN_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export type PinSnapshot = "pending" | "remembered" | "locked" | "setup";

export function getPinSnapshot(): PinSnapshot {
  if (isPinRemembered()) return "remembered";
  if (hasPin()) return "locked";
  return "setup";
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${pin}`);
}

export function isValidPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function getStoredPin(): StoredPin | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPin;
    if (!parsed.hash || !parsed.salt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasPin(): boolean {
  return getStoredPin() !== null;
}

export function getRememberPreference(): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PIN_REMEMBER_PREF_KEY) === "1";
}

export function setRememberPreference(enabled: boolean) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PIN_REMEMBER_PREF_KEY, enabled ? "1" : "0");
  if (!enabled) {
    window.localStorage.removeItem(PIN_REMEMBER_UNTIL_KEY);
  }
  notifyPinChanged();
}

export function isPinRemembered(): boolean {
  if (!canUseStorage() || !getRememberPreference()) return false;
  const raw = window.localStorage.getItem(PIN_REMEMBER_UNTIL_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && until > Date.now();
}

export function markPinRemembered() {
  if (!canUseStorage() || !getRememberPreference()) return;
  window.localStorage.setItem(
    PIN_REMEMBER_UNTIL_KEY,
    String(Date.now() + REMEMBER_MS),
  );
  notifyPinChanged();
}

export async function savePin(pin: string): Promise<boolean> {
  if (!canUseStorage() || !isValidPin(pin)) return false;
  const salt = crypto.randomUUID();
  const hash = await hashPin(pin, salt);
  window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({ hash, salt }));
  if (getRememberPreference()) {
    window.localStorage.setItem(
      PIN_REMEMBER_UNTIL_KEY,
      String(Date.now() + REMEMBER_MS),
    );
  }
  notifyPinChanged();
  return true;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = getStoredPin();
  if (!stored || !isValidPin(pin)) return false;
  const hash = await hashPin(pin, stored.salt);
  return hash === stored.hash;
}
