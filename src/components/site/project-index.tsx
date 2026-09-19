"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ProjectView } from "@/lib/data";

/**
 * The numbered project index with cursor-following image previews — the
 * signature interaction of the Selected Works list. On desktop, hovering a
 * row floats a preview card near the cursor; on touch devices the rows are
 * plain links.
 */
export function ProjectIndex({ projects }: { projects: ProjectView[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const total = projects.length;

  return (
    <div ref={containerRef} onMouseMove={onMouseMove} onMouseLeave={() => setHovered(null)} className="relative">
      <ul className="divide-y divide-border border-y border-border" aria-label="Project list">
        {projects.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/project/${p.slug}`}
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              className="group grid grid-cols-12 gap-4 md:gap-8 items-start md:items-center py-6 md:py-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring -mx-2 px-2"
            >
              {/* Row number */}
              <span className="col-span-3 md:col-span-1 label-mono text-muted-foreground transition-colors group-hover:text-cobalt">
                {String(p.order).padStart(2, "0")}
              </span>

              {/* Title + subtitle */}
              <span className="col-span-9 md:col-span-5 flex flex-col gap-1">
                <span className="font-body text-xl md:text-2xl font-light tracking-tight text-foreground transition-colors group-hover:text-cobalt">
                  {p.title}
                </span>
                <span className="font-body text-sm text-muted-foreground md:hidden">{p.subtitle}</span>
              </span>

              {/* Category (desktop) */}
              <span className="hidden md:block md:col-span-3 label-mono text-muted-foreground transition-colors group-hover:text-cobalt">
                {p.category}
              </span>

              {/* Year (desktop) */}
              <span className="hidden md:block md:col-span-2 label-mono text-muted-foreground transition-colors group-hover:text-cobalt">
                {p.year}
              </span>

              {/* Arrow */}
              <span className="hidden md:flex md:col-span-1 justify-end">
                <span className="font-mono text-sm text-muted-foreground transition-all duration-300 group-hover:text-cobalt group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Cursor-following preview card (desktop only) */}
      <AnimatePresence>
        {hovered !== null && typeof window !== "undefined" && window.innerWidth >= 768 && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none fixed z-30 hidden md:block w-56 h-72 overflow-hidden border border-border bg-card shadow-xl"
            style={{ left: pos.x + 28, top: pos.y - 140 }}
            aria-hidden
          >
            {projects[hovered] && (
              <img
                src={projects[hovered].coverImage}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {total === 0 && (
        <p className="py-16 text-center font-body text-muted-foreground">
          No projects here yet — check back soon.
        </p>
      )}
    </div>
  );
}
