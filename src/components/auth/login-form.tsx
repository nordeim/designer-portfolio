"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { SITE } from "@/lib/site-config";

/**
 * Credentials sign-in — the reference app's auth-screen design: a centered
 * rounded card on a soft gradient, an app-initial avatar with a glow, a
 * Google affordance above an OR divider, left-labelled rounded inputs with
 * inline Mail/Lock icons, a full-width dark submit, and the
 * forgot-password / sign-up pair on a bottom justify-between row.
 *
 * Divergences (documented in docs/remediation-plan-session-17.md): Google
 * OAuth and password reset render honest "not configured" notices instead
 * of linking to flows that don't exist on this deployment, and sign-up
 * explains the single-owner design.
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

  const avatarInitial = SITE.title[0] ?? "A";

  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
        {/* Top accent line — the reference card's gradient hairline. */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" aria-hidden />

        <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
            {/* App avatar with glow — the reference's initial-circle. */}
            <div className="relative">
              <div
                className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-75"
                aria-hidden
              />
              <span className="flex shrink-0 overflow-hidden relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg rounded-full">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xl sm:text-2xl font-bold text-slate-700">
                  {avatarInitial}
                </span>
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h1 className="font-body text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome to {SITE.title}
              </h1>
              <p className="font-body text-sm sm:text-base font-medium text-slate-500">
                Sign in to continue
              </p>
            </div>

            <div className="w-full flex flex-col gap-6">
              <button
                type="button"
                onClick={() => setGoogleHint(true)}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-[12px] border border-slate-200 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                <p className="text-xs text-slate-500" role="note">
                  Google sign-in is not configured on this deployment. Use email and password below.
                </p>
              )}

              <div className="flex items-center gap-4" aria-hidden>
                <span className="flex-1 h-px bg-slate-200" />
                <span className="font-body text-xs text-slate-400">OR</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 sm:gap-5" aria-label="Email and password sign-in">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="font-body text-sm font-medium leading-4 text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="flex w-full h-12 rounded-[12px] border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="font-body text-sm font-medium leading-4 text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="flex w-full h-12 rounded-[12px] border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                {serverError && (
                  <p className="text-sm text-destructive" role="alert">
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full inline-flex items-center justify-center gap-1 h-12 rounded-[12px] bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none"
                >
                  {pending ? "Signing in…" : "Sign in"}
                </button>

                {authHint === "forgot" && (
                  <p className="font-body text-xs text-slate-500 text-left" role="note">
                    Password reset is not configured on this deployment (no SMTP). Email{" "}
                    <a href={`mailto:${SITE.email}`} className="text-cobalt hover:underline">
                      {SITE.email}
                    </a>{" "}
                    from your owner address to request a reset.
                  </p>
                )}
                {authHint === "signup" && (
                  <p className="font-body text-xs text-slate-500 text-left" role="note">
                    This portfolio accepts a single owner account (seeded on first boot) — sign-up is disabled by design.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <button
                    type="button"
                    className="font-body text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    onClick={() => setAuthHint("forgot")}
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    className="font-body text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    onClick={() => setAuthHint("signup")}
                  >
                    Need an account? Sign up
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
