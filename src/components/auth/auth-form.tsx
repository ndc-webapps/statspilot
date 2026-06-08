"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function AuthForm({ mode, googleEnabled }: { mode: "login" | "register"; googleEnabled: boolean }) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, confirmPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not create account");
          setSubmitting(false);
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(isRegister ? "Account created, but sign-in failed. Try logging in." : "Invalid email or password.");
        setSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setSubmitting(false);
    }
  }

  function handleGoogle() {
    if (!googleEnabled) {
      setError("Google sign-in isn't set up yet. Please use your email for now.");
      return;
    }
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo href={null} className="h-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {isRegister ? "Start tracking your projects in one dashboard." : "Log in to your StatsPilot dashboard."}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="mt-6 w-full"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">or</span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Name <span className="text-neutral-400 dark:text-neutral-500">(optional)</span>
                </label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "At least 8 characters" : "••••••••"}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 8 : undefined}
              />
            </div>

            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            )}

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">{error}</p>}

            <Button type="submit" disabled={submitting || googleLoading} className="mt-1">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isRegister ? "Create account" : "Log in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                  Log in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
