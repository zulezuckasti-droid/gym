import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { ExportDataButton } from "@/components/settings/export-data-button";
import { PinSettings } from "@/components/settings/pin-settings";
import { SyncStatus } from "@/components/settings/sync-status";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-8 space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">Content</p>
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href="/templates"
              className="flex min-h-11 items-center text-sm font-medium transition-colors duration-150 hover:text-primary active:text-primary"
            >
              Manage templates
            </Link>
            <Link
              href="/exercises"
              className="flex min-h-11 items-center text-sm font-medium transition-colors duration-150 hover:text-primary active:text-primary"
            >
              Exercise library
            </Link>
          </div>
        </div>

        <PinSettings />

        <div>
          <p className="text-sm text-muted-foreground">Data</p>
          <div className="mt-2">
            <ExportDataButton />
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 text-sm font-medium">{email ?? "Unknown"}</p>
        </div>

        <SyncStatus />

        <LogoutButton />
      </section>
    </main>
  );
}
