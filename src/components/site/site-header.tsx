"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { RadialMenu, type MenuProject } from "@/components/site/radial-menu";
import { LOGO_BREATH } from "@/lib/site-config";

/**
 * Fixed header overlay, matching the reference app's chrome:
 * - A/M "breathing" logo (letter-spacing expands to 0.7em and settles back
 *   on a ~7s loop) top-left;
 * - theme toggle at top-center (desktop) / inline (mobile);
 * - Menu button top-right opening the radial wheel overlay;
 * - "Start a Project →" pinned to the bottom-right corner.
 * Over the full-bleed dark hero of a project page the chrome switches to
 * gallery (#F5F5F7) until the visitor scrolls past 80% of the viewport.
 *
 * The reference sets aria-hidden on this overlay container, which would hide
 * focusable links from assistive tech — a WCAG violation we deliberately do
 * not replicate; the chrome stays in the accessibility tree.
 */

type LogoPhase = "idle" | "spacing" | "reset";

function BreathingLogo({ light }: { light: boolean }) {
  const [phase, setPhase] = useState<LogoPhase>("idle");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = (fn: () => void, ms: number) => {
      t = setTimeout(fn, ms);
    };
    // Source cadence (session 30 probe, 20 s @100 ms sampling — the machine
    // constants live in site-config LOGO_BREATH): tight 3.3 s → expand 0.4 s
    // → EXPANDED HOLD 3.4 s → collapse 0.35 s → repeat (≈7.4 s cycle). The
    // source rests mostly-EXPANDED; the old machine's 0.5 s spacing phase
    // collapsed before the logo ever rested at 0.7em.
    const start = () => {
      schedule(() => {
        setPhase("spacing");
        schedule(() => {
          setPhase("reset");
          schedule(() => {
            setPhase("idle");
            schedule(start, LOGO_BREATH.restartMs);
          }, LOGO_BREATH.resetMs);
        }, LOGO_BREATH.spacingMs);
      }, LOGO_BREATH.idleMs);
    };
    start();
    return () => clearTimeout(t);
  }, []);

  const letterSpacing = phase === "spacing" ? "0.7em" : "0.05em";
  return (
    <span
      className="font-mono text-xs md:text-sm uppercase"
      style={{
        letterSpacing,
        transition:
          phase === "spacing"
            ? "letter-spacing 0.4s cubic-bezier(0.65, 0, 0.35, 1)"
            : phase === "reset"
              ? "letter-spacing 0.35s cubic-bezier(0.65, 0, 0.35, 1)"
              : "none",
      }}
    >
      A/M
    </span>
  );
}

/**
 * Whether the visitor is still within the dark hero band of a project page
 * (top 80% of the viewport) — read via useSyncExternalStore so the scroll
 * source of truth lives outside React and re-renders are change-driven.
 */
function useAtViewportTop(enabled: boolean): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!enabled) return () => {};
      window.addEventListener("scroll", onStoreChange, { passive: true });
      return () => window.removeEventListener("scroll", onStoreChange);
    },
    [enabled],
  );
  const getSnapshot = useCallback(
    () => (enabled ? window.scrollY < window.innerHeight * 0.8 : true),
    [enabled],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

export function SiteHeader({ projects }: { projects: MenuProject[] }) {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const isProjectPage = pathname?.startsWith("/project/") ?? false;
  const atTop = useAtViewportTop(isProjectPage);

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const overDarkHero = isProjectPage && atTop;
  const chrome = overDarkHero ? "text-gallery" : "text-foreground";
  const mobileBarDim = !atTop && typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* Mobile top bar */}
        <div
          className="pointer-events-none md:hidden fixed top-6 left-6 right-6 flex justify-between items-center"
          style={
            mobileBarDim
              ? {
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "8px",
                  padding: "8px",
                  height: "40px",
                  transition: "all 0.3s ease",
                }
              : { transition: "all 0.3s ease" }
          }
        >
          <Link
            href="/"
            className={`pointer-events-auto hover:text-cobalt transition-colors duration-500 focus:outline-none ${chrome}`}
            aria-label="Alex Moreau — home"
          >
            <BreathingLogo light={overDarkHero} />
          </Link>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={`pointer-events-auto p-1.5 hover:text-cobalt transition-colors duration-300 focus:outline-none ${chrome}`}
            aria-label="Toggle dark mode"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5 scale-90 dark:block" aria-hidden />
            ) : (
              <Moon className="w-5 h-5 scale-90 dark:hidden" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`pointer-events-auto font-mono text-xs tracking-widest uppercase hover:text-cobalt transition-colors duration-500 focus:outline-none ${chrome}`}
            aria-label="Open menu"
          >
            Menu
          </button>
        </div>

        {/* Desktop chrome */}
        <div className="hidden md:block">
          <Link
            href="/"
            className={`pointer-events-auto absolute top-6 left-6 md:top-8 md:left-8 hover:text-cobalt transition-colors duration-500 focus:outline-none ${chrome}`}
            aria-label="Alex Moreau — home"
          >
            <BreathingLogo light={overDarkHero} />
          </Link>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={`pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 md:top-8 p-1.5 hover:text-cobalt transition-colors duration-300 focus:outline-none ${chrome}`}
            aria-label="Toggle dark mode"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5 scale-90 dark:block" aria-hidden />
            ) : (
              <Moon className="w-5 h-5 scale-90 dark:hidden" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`pointer-events-auto absolute top-6 right-6 md:top-8 md:right-8 font-mono text-xs md:text-sm tracking-widest uppercase hover:text-cobalt transition-colors duration-500 focus:outline-none ${chrome}`}
            aria-label="Open menu"
          >
            Menu
          </button>
        </div>

        {/* Persistent corner call-to-action */}
        <Link
          href="/contact"
          className={`pointer-events-auto absolute bottom-[26px] right-[26px] font-mono text-xs md:text-sm tracking-widest uppercase hover:text-cobalt transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4 ${chrome}`}
        >
          Start a Project →
        </Link>
      </div>

      <AnimatePresence>{open && <RadialMenu projects={projects} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
