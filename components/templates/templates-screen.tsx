"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTemplate } from "@/lib/content/actions";
import type { TemplateListItem } from "@/lib/content/queries";

export function TemplatesScreen({
  templates,
  error,
}: {
  templates: TemplateListItem[];
  error: string | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setFormError(null);
    startTransition(async () => {
      const result = await createTemplate(name);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setCreateOpen(false);
      setName("");
      if (result.id) {
        router.push(`/templates/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New
        </Button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-6 space-y-3 pb-4">
        {templates.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">
            No templates yet. Create one to get started.
          </p>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="py-0">
              <CardContent className="p-0">
                <Link
                  href={`/templates/${template.id}`}
                  className="flex min-h-16 w-full items-center justify-between px-5 text-left"
                >
                  <span className="text-lg font-semibold">{template.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {template.exerciseCount}{" "}
                    {template.exerciseCount === 1 ? "exercise" : "exercises"}
                  </span>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Push, Pull, Legs…"
              className="h-11"
            />
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="flex-col sm:flex-col">
            <Button
              className="h-11 w-full"
              disabled={pending || !name.trim()}
              onClick={handleCreate}
            >
              {pending ? "Creating…" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
