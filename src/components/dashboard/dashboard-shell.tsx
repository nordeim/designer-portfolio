"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FolderKanban, Inbox, Menu, X, ExternalLink } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { SITE } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DashUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/inquiries", label: "Inquiries", icon: Inbox },
];

/**
 * Dashboard chrome: fixed sidebar on desktop, slide-over on mobile, sign-out
 * via server action. The public site link opens the portfolio in a new tab.
 */
export function DashboardShell({ user, children }: { user: DashUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await logoutAction();
      router.replace("/login");
    });
  }

  const initials = (user.name ?? user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Dashboard navigation">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "bg-sidebar-accent text-foreground border-l-2 border-cobalt"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center border border-border bg-card label-mono text-foreground">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-body text-foreground truncate">{user.name ?? user.email}</p>
          <p className="label-mono text-muted-foreground">{user.role}</p>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-2">
      <Button variant="outline" asChild className="justify-start font-body text-sm">
        <a href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" aria-hidden />
          View public site
        </a>
      </Button>
      <Button
        variant="outline"
        onClick={signOut}
        disabled={pending}
        className="justify-start font-body text-sm"
      >
        {/* The reference's sign-out row carries the owner's avatar — a solid
            dark round circle with the white initial, pulled flush against
            the button's left border (see
            docs/designer-portfolio-dashboard.png). */}
        <span
          className="-ml-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-medium text-background"
          aria-hidden
        >
          {initials.charAt(0)}
        </span>
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <p className="label-mono text-muted-foreground">{SITE.initials} — STUDIO</p>
        </div>
        <div className="p-6 flex flex-col gap-8 flex-1">
          {header}
          {nav}
        </div>
        <div className="p-6 border-t border-border">{footer}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <p className="label-mono text-muted-foreground">{SITE.initials} — STUDIO</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open dashboard navigation"
          className="p-2 text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Mobile slide-over */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-border flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <p className="label-mono text-muted-foreground">{SITE.initials} — STUDIO</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="p-2 text-foreground hover:text-cobalt"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-8 flex-1">
              {header}
              {nav}
            </div>
            <div className="p-6 border-t border-border">{footer}</div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="pt-14 lg:pt-0" />
        {children}
      </div>
    </div>
  );
}
