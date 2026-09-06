"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, TriangleAlert, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";
import { site } from "@/lib/site";
import { hasSeenOnboarding } from "@/lib/user-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AUTH_ERROR_MESSAGES = new Map([
  ["auth_error", "Sign-in failed or was cancelled. Please try again."],
]);

const DEFAULT_AUTH_ERROR_MESSAGE = "Sign-in failed. Please try again.";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? (AUTH_ERROR_MESSAGES.get(errorCode) ?? DEFAULT_AUTH_ERROR_MESSAGE)
    : null;
  // `/auth/callback` appends `type=recovery` once it's exchanged a password
  // reset link's code, since the exchange happens server-side there and
  // this component never sees the raw recovery code itself to react to.
  const isRecoveryLink = searchParams.get("type") === "recovery";

  const supabase = createClient();

  const [mode, setMode] = React.useState<"signin" | "signup" | "forgot" | "reset">(
    isRecoveryLink ? "reset" : "signin",
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [dismissedErrorCode, setDismissedErrorCode] = React.useState<string | null>(null);

  // Belt-and-suspenders: also react to Supabase's own PASSWORD_RECOVERY
  // event in case a recovery session ever gets established on the client
  // directly (e.g. a hash-based recovery link that never passes through
  // /auth/callback), not just via the `type=recovery` query flag above.
  React.useEffect(() => {
    const client = createClient();
    if (!client) return;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => subscription.unsubscribe();
  }, []);

  // Self-host / preview mode: Supabase isn't configured, so there's no auth.
  if (!supabase) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Sign-in is not available on this deployment. StudyMap is running in preview
            mode without accounts. The map and calendar work fully without signing in.
          </p>
          <Button asChild className="mt-4">
            <Link href="/map">Go to the map</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Non-null past the guard above; captured so the handler closures below
  // don't re-widen it back to `SupabaseClient | null`.
  const client = supabase;

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await client.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account.");
      }
    } else {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        // Password sign-in never passes through /auth/callback, so the
        // first-run-onboarding check (#204) that route does for OAuth has
        // to happen here too. Fails open to `next` on any error.
        const seen = await hasSeenOnboarding().catch(() => true);
        router.push(seen ? next : `/onboarding?next=${encodeURIComponent(next)}`);
        router.refresh();
      }
    }

    setLoading(false);
  }

  async function handleGoogle() {
    // Use the explicit env var for local dev (http://localhost:3000),
    // fall back to the hardcoded canonical domain so any auto-assigned
    // Vercel URL never leaks into the OAuth redirectTo.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) toast.error(error.message);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Reuses the same /auth/callback redirect convention as Google OAuth
    // above. The callback route detects the recovery-typed code exchange
    // and appends `type=recovery` so this form knows to switch to the
    // update-password state once the user lands back here.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/login")}`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a link to reset your password.");
    }

    setLoading(false);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await client.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated.");
      // Same first-run-onboarding check handleEmailAuth does for password
      // sign-in: a recovery session doesn't pass through /auth/callback's
      // own onboarding check, so it has to happen here too.
      const seen = await hasSeenOnboarding().catch(() => true);
      router.push(seen ? next : `/onboarding?next=${encodeURIComponent(next)}`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-light.svg"
            alt="StudyMap"
            width={160}
            height={30}
            className="h-8 w-auto dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-dark.svg"
            alt="StudyMap"
            width={160}
            height={30}
            className="hidden h-8 w-auto dark:block"
          />
          <p className="text-sm text-muted-foreground">
            {mode === "signin" && "Sign in to continue"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
            {mode === "reset" && "Choose a new password"}
          </p>
        </div>

        {errorMessage && dismissedErrorCode !== errorCode && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">{errorMessage}</p>
            <button
              type="button"
              aria-label="Dismiss sign-in error"
              className="flex size-6 shrink-0 items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setDismissedErrorCode(errorCode)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          {(mode === "signin" || mode === "signup") && (
            <>
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 gap-2"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" className="size-4 shrink-0">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
                </div>
              </div>
            </>
          )}

          {/* Email form */}
          <form
            onSubmit={
              mode === "forgot"
                ? handleForgotPassword
                : mode === "reset"
                  ? handleUpdatePassword
                  : handleEmailAuth
            }
            className="space-y-3"
          >
            {mode !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {mode === "reset" ? "New password" : "Password"}
                  </Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "signin" ? "••••••••" : "Min. 6 characters"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" && "Sign in"}
              {mode === "signup" && "Create account"}
              {mode === "forgot" && "Send reset link"}
              {mode === "reset" && "Update password"}
            </Button>
          </form>
        </div>

        {/* Toggle mode */}
        {(mode === "signin" || mode === "signup") && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        )}
        {mode === "forgot" && (
          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Back to sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
