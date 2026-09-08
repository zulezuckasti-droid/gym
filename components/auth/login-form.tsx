"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setIsLoading(false);

    if (signInError) {
      const message = signInError.message.toLowerCase();
      if (
        message.includes("rate limit") ||
        message.includes("over_email_send_rate_limit")
      ) {
        setError(
          "Too many sign-in emails sent. Wait about an hour, then request one new link.",
        );
      } else {
        setError(signInError.message);
      }
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to <span className="text-foreground">{email}</span>.
          Open the latest email only — older links stop working. The link expires in
          about an hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="h-11"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isLoading || !email}
        className="h-11 w-full"
        size="lg"
      >
        {isLoading ? "Sending link..." : "Send magic link"}
      </Button>
    </form>
  );
}
