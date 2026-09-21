import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  // No distinct title — the reference app's login tab also shows the site
  // name ("Designer Portfolio") via the root title template.
  description: "Sign in to the Designer Portfolio dashboard.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in? Go straight to the dashboard.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <section aria-label="Sign in">
        <LoginForm />
      </section>
    </main>
  );
}
