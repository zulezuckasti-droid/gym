"use client";

import { Button } from "@/components/ui/button";
import { useWorkoutStore } from "@/lib/workout/store";

const labels: Record<string, string> = {
  pending: "Pending sync",
  syncing: "Syncing…",
  failed: "Sync failed",
};

export function SyncStatus() {
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const queue = useWorkoutStore((state) => state.queue);
  const syncStatus = useWorkoutStore((state) => state.syncStatus);
  const retryQueue = useWorkoutStore((state) => state.retryQueue);

  if (!hydrated || queue.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">Sync status</p>
        <p className="mt-1 text-sm font-medium">All workouts synced</p>
      </div>
    );
  }

  const label = labels[syncStatus] ?? "Pending sync";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-muted-foreground">Sync status</p>
        <p className="mt-1 text-sm font-medium">
          {label}
          {queue.length > 1 ? ` · ${queue.length} workouts` : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={syncStatus === "syncing"}
        onClick={() => void retryQueue()}
      >
        {syncStatus === "syncing" ? "Syncing…" : "Retry sync"}
      </Button>
    </div>
  );
}
