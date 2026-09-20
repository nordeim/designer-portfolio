"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Credentials sign-in. Google OAuth is offered as a visible affordance that
 * renders an explicit "not configured" notice — an honest-unconfigured
 * pattern (the button is inert until GOOGLE_CLIENT_ID/SECRET are provided by
 * the deployment).
 */
export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleHint, setGoogleHint] = useState(false);
  const [authHint, setAuthHint] = useState<"forgot" | "signup" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.ok) {
        toast.success("Signed in — welcome back.");
        router.replace("/dashboard");
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setGoogleHint(true)}
        className="flex items-center justify-center gap-3 border border-border bg-card px-4 h-11 font-body text-sm text-foreground hover:border-foreground/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
      {googleHint && (
        <p className="text-xs text-muted-foreground" role="note">
          Google sign-in is not configured on this deployment. Use email and password below.
        </p>
      )}

      <div className="flex items-center gap-4" aria-hidden>
        <span className="flex-1 h-px bg-border" />
        <span className="label-mono text-muted-foreground">OR</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5" aria-label="Email and password sign-in">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="font-body text-xs text-muted-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => setAuthHint("forgot")}
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={pending} className="label-mono py-6">
          {pending ? "SIGNING IN…" : "SIGN IN"}
        </Button>

        {authHint === "forgot" && (
          <p className="font-body text-xs text-muted-foreground" role="note">
            Password reset is not configured on this deployment (no SMTP). Email{" "}
            <a href="mailto:hello@alexmoreau.design" className="text-cobalt hover:underline">
              hello@alexmoreau.design
            </a>{" "}
            from your owner address to request a reset.
          </p>
        )}
        {authHint === "signup" && (
          <p className="font-body text-xs text-muted-foreground" role="note">
            This portfolio accepts a single owner account (seeded on first boot) — sign-up is disabled by design.
          </p>
        )}

        <p className="font-body text-xs text-muted-foreground text-center">
          <button
            type="button"
            className="hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={() => setAuthHint("signup")}
          >
            Need an account? Sign up
          </button>
        </p>
      </form>
    </div>
  );
}
