"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportGymData } from "@/lib/content/export";

export function ExportDataButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setPending(true);
    const result = await exportGymData();
    setPending(false);
    if (result.error || result.data === undefined) {
      setError(result.error ?? "Export failed.");
      return;
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `gym-export-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={pending}
        onClick={() => void handleExport()}
      >
        {pending ? "Exporting…" : "Export JSON"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
