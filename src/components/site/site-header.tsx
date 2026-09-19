"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun, X } from "lucide-react";
import { SITE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export interface MenuProject {
  id: string;
  slug: string;
  order: number;
  title: string;
}

/**
 * Fixed site header: initials (left), theme toggle (center), MENU (right).
 * The MENU button opens a full-screen overlay navigation with the public
 * routes plus the project list (server-provided via props). Links close the
 * overlay in their click handlers (not in an effect). Theme icons swap via
 * CSS (`.dark:` variants) so there is no hydration-time state mismatch.
 */
export function SiteHeader({ projects }: { projects: MenuProject[] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const menuProjects = projects;
  const close = () => setOpen(false);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-colors duration-300",
          scrolled ? "bg-background/90 backdrop-blur-sm border-b border-border/60" : "bg-transparent",
        )}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`${SITE.name} — home`}
          >
            {SITE.initials}
          </Link>

          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="text-foreground/70 hover:text-foreground transition-colors p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? <Sun className="hidden h-4 w-4 dark:block" /> : <Moon className="h-4 w-4 dark:hidden" />}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            MENU
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && <MenuOverlay projects={menuProjects} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

function MenuOverlay({ projects, onClose }: { projects: MenuProject[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-background grid-lines"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 h-full flex flex-col py-8">
        <div className="flex items-center justify-between h-12">
          <span className="label-mono text-muted-foreground">NAVIGATION</span>
          <button
            type="button"
            onClick={onClose}
            className="label-mono text-foreground hover:text-cobalt transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden /> CLOSE MENU
          </button>
        </div>

        <nav className="flex-1 flex flex-col justify-center gap-2 md:gap-3" aria-label="Menu">
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <MenuLink href="/" index="01" onClose={onClose}>
              Home
            </MenuLink>
          </motion.div>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-baseline gap-8">
              <MenuLink href="/projects" index="02" onClose={onClose}>
                Projects
              </MenuLink>
              <button
                type="button"
                className="label-mono text-muted-foreground hover:text-cobalt transition-colors md:hidden"
                aria-expanded
              >
                all works
              </button>
            </div>
          </motion.div>
          <motion.ul
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="md:pl-24 md:gap-1 gap-1 flex flex-col"
            aria-label="All projects"
          >
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/project/${p.slug}`}
                  onClick={onClose}
                  className="group inline-flex items-baseline gap-4 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="label-mono text-muted-foreground group-hover:text-cobalt transition-colors">
                    {String(p.order).padStart(2, "0")}
                  </span>
                  <span className="text-lg md:text-xl font-light tracking-tight group-hover:text-cobalt transition-colors">
                    {p.title}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <MenuLink href="/about" index="03" onClose={onClose}>
              About
            </MenuLink>
          </motion.div>
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
            <MenuLink href="/contact" index="04" onClose={onClose}>
              Contact
            </MenuLink>
          </motion.div>
        </nav>

        <div className="label-mono text-muted-foreground pb-4">{SITE.email}</div>
      </div>
    </motion.div>
  );
}

function MenuLink({
  href,
  index,
  onClose,
  children,
}: {
  href: string;
  index: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="group inline-flex items-baseline gap-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span className="label-mono text-muted-foreground group-hover:text-cobalt transition-colors">{index}</span>
      <span className="text-3xl md:text-5xl font-light tracking-tight group-hover:text-cobalt transition-colors">
        {children}
      </span>
    </Link>
  );
}
