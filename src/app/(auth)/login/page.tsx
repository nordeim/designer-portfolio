import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Designer Portfolio dashboard.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in? Go straight to the dashboard.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <section className="min-h-screen grid place-items-center bg-background grid-lines px-6" aria-label="Sign in">
      <div className="w-full max-w-sm flex flex-col gap-8 py-16">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="label-mono text-muted-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {SITE.initials}
          </Link>
          <h1 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground">
            Welcome to {SITE.title}
          </h1>
          <p className="font-body text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <LoginForm />
      </div>
    </section>
  );
}
