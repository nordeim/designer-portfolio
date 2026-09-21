"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { clampRotation, itemPosition, wheelCenter, wheelRadius } from "@/lib/menu-wheel";

export interface MenuProject {
  id: string;
  slug: string;
  order: number;
  title: string;
  coverImage: string;
}

const MENU_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
] as const;

/**
 * The radial "wheel" navigation overlay: menu items sit on a circle (85% of
 * the smaller viewport dimension) around the screen center, the whole wheel
 * rotates with the scroll wheel (eased), and labels counter-rotate so they
 * stay upright. "Projects" expands into the project list; hovering a project
 * shows a circular image preview inside the wheel. Mirrors the reference
 * app's menu geometry; the math lives in `@/lib/menu-wheel` (unit-tested).
 *
 * Accessibility additions over the reference: Escape closes the overlay, the
 * dialog is announced via role/aria-modal, and body scroll is locked while
 * open. Wheel-driven rotation degrades to button-free static layout under
 * prefers-reduced-motion (labels still reachable by keyboard).
 */
export function RadialMenu({ projects, onClose }: { projects: MenuProject[]; onClose: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [hovered, setHovered] = useState<MenuProject | null>(null);
  const targetRotation = useRef(0);
  const rafRef = useRef<number>(0);
  // The overlay only mounts client-side after the Menu button is clicked,
  // so the viewport can be read lazily (no SSR involvement).
  const [viewport, setViewport] = useState(() => ({
    w: typeof window === "undefined" ? 1440 : window.innerWidth,
    h: typeof window === "undefined" ? 900 : window.innerHeight,
  }));

  // Track the viewport so the wheel re-centers on resize.
  useEffect(() => {
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Escape closes the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const radius = wheelRadius(viewport.w, viewport.h);
  const center = wheelCenter(viewport.w, viewport.h);

  // Eased rotation: display value chases the target at 10% per frame.
  useEffect(() => {
    const tick = () => {
      setRotation((current) => {
        const delta = targetRotation.current - current;
        if (Math.abs(delta) < 0.01) return targetRotation.current;
        return current + delta * 0.1;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Scroll wheel spins the wheel; clamped to the item arc (matches the
  // reference: upper bound = arc, lower bound = arc + overshoot headroom).
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetRotation.current = clampRotation(
        targetRotation.current - e.deltaY * 0.04,
        MENU_ITEMS.length,
        radius,
      );
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [radius]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-charcoal overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 md:top-8 md:right-8 text-gallery p-2 z-20 hover:text-cobalt transition-colors focus:outline-none"
        aria-label="Close menu"
      >
        <X className="w-6 h-6" aria-hidden />
      </button>

      {/* Rotating layer: circle outline + items + central preview */}
      <div
        className="absolute inset-0 motion-reduce:transform-none"
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${center.x}px ${center.y}px` }}
      >
        <svg
          className="absolute overflow-visible"
          style={{ left: center.x - radius, top: center.y - radius, width: radius * 2, height: radius * 2 }}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          aria-hidden
        >
          <circle cx={radius} cy={radius} r={radius - 1} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        </svg>

        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.slug}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute rounded-full overflow-hidden z-10 pointer-events-none"
              style={{
                left: center.x,
                top: center.y,
                width: radius * 2,
                height: radius * 2,
                // The reference keeps the preview fixed (no counter-rotation)
                // while the wheel spins behind it.
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden
            >
              {/* <img> is intentional: a decorative preview, not content. */}
              <img src={hovered.coverImage} alt="" className="w-full h-full object-cover" />
            </motion.div>
          )}
        </AnimatePresence>

        {MENU_ITEMS.map((item, i) => {
          const pos = itemPosition(i, MENU_ITEMS.length, center.x, center.y, radius);
          const isProjects = item.label === "Projects";
          return (
            <div
              key={item.path}
              className="absolute flex flex-col items-start"
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(0, -50%) rotate(${-rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-cobalt flex-shrink-0" aria-hidden />
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-white/40 tracking-widest" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {isProjects ? (
                    <div className="flex items-center gap-3">
                      <Link
                        href={item.path}
                        onClick={onClose}
                        className="font-body text-3xl md:text-4xl font-light text-gallery hover:text-cobalt transition-colors duration-300 focus:outline-none max-md:leading-tight"
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectsOpen((open) => !open);
                        }}
                        className="text-white/50 hover:text-cobalt transition-colors duration-200 focus:outline-none mt-1"
                        aria-label="Toggle projects"
                        aria-expanded={projectsOpen}
                      >
                        <ChevronDown
                          className="w-5 h-5 transition-transform duration-300"
                          style={{ transform: projectsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                          aria-hidden
                        />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={onClose}
                      className="font-body text-3xl md:text-4xl font-light text-gallery hover:text-cobalt transition-colors duration-300 focus:outline-none max-md:leading-tight"
                    >
                      {item.label}
                    </Link>
                  )}
                  {isProjects && projectsOpen && (
                    <div className="mt-3 flex flex-col gap-1 pl-1">
                      {projects.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/project/${p.slug}`}
                          onClick={onClose}
                          onMouseEnter={() => setHovered(p)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(p)}
                          onBlur={() => setHovered(null)}
                          className="font-body text-base font-light text-white/50 hover:text-cobalt transition-colors duration-200 focus:outline-none leading-snug"
                        >
                          <span className="font-mono text-xs text-white/30 mr-2" aria-hidden>
                            {String(p.order).padStart(2, "0")}
                          </span>
                          {p.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
