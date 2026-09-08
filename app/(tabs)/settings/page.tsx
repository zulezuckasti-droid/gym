import { LogoutButton } from "@/components/auth/logout-button";
import { SyncStatus } from "@/components/settings/sync-status";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-8 space-y-8">
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
