export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reconnect to load templates and history. An active workout on this
        device still works.
      </p>
    </main>
  );
}
