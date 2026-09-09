import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const authError = params.error === "auth";

  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 pt-[max(3rem,var(--safe-area-top))] pb-[max(3rem,var(--safe-area-bottom))]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Gym</CardTitle>
          <CardDescription>
            Sign in with a magic link sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError ? (
            <p className="text-center text-sm text-destructive" role="alert">
              Sign-in link expired or invalid. Request a new one.
            </p>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
