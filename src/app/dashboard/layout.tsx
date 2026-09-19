import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * Dashboard layout — the auth gate. Every /dashboard/* render resolves the
 * session first; unauthenticated visitors are redirected to /login with a
 * return path. The gate lives here (not in a nested layout) so /login itself
 * never loops.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
