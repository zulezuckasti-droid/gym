"use client";

import { useEffect } from "react";

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function requestLock() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        sentinel = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible" && !cancelled) {
        void requestLock();
      }
    }

    void requestLock();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
      sentinel = null;
    };
  }, [active]);
}
