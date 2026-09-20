"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export interface IndexProject {
  id: string;
  slug: string;
  order: number;
  title: string;
  category: string;
  year: string;
  image: string;
}

/**
 * The project archive rows. On desktop, hovering a row sweeps a foreground
 * fill across it from the left (scaleX 0→1) while the text inverts to the
 * page background color; a preview image follows the cursor. On mobile each
 * row leads with its cover image. Mirrors the reference app's archive list.
 *
 * Note: the preview card is `fixed`, so it positions with viewport
 * coordinates (clientX/clientY) — not container-relative ones.
 */
export function ProjectIndex({ projects }: { projects: IndexProject[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div
      className="min-h-screen"
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
    >
      <div className="border-t border-border">
        {projects.map((project, i) => (
          <Link
            key={project.id}
            href={`/project/${project.slug}`}
            className="group block border-b border-border relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
          >
            {/* Desktop hover fill */}
            <motion.div
              className="hidden md:block absolute inset-0 bg-foreground"
              initial={false}
              animate={{ scaleX: hovered === i ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
              style={{ originX: 0 }}
              aria-hidden
            />

            {/* Mobile cover image */}
            <div className="md:hidden relative z-10">
              {/* Raw <img>: row cover imagery with intrinsic sizing. */}
              <img src={project.image} alt={project.title} className="w-full h-48 object-cover" loading="lazy" />
            </div>

            <div className="relative z-10 px-6 md:px-8 py-7 md:py-8 grid grid-cols-12 items-center gap-4">
              <div className="col-span-2 md:col-span-1">
                <span className="font-mono text-xs tracking-widest text-muted-foreground md:group-hover:text-background transition-colors duration-300">
                  {String(project.order).padStart(2, "0")}
                </span>
              </div>
              <div className="col-span-7 md:col-span-5">
                <span className="font-body text-xl md:text-2xl font-light tracking-tight text-foreground md:group-hover:text-background transition-colors duration-300">
                  {project.title}
                </span>
              </div>
              <div className="hidden md:block col-span-3">
                <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground md:group-hover:text-background/60 transition-colors duration-300">
                  {project.category}
                </span>
              </div>
              <div className="hidden md:block col-span-2">
                <span className="font-mono text-xs tracking-widest text-muted-foreground md:group-hover:text-background transition-colors duration-300">
                  {project.year}
                </span>
              </div>
              <div className="col-span-3 md:col-span-1 flex justify-end">
                <motion.span
                  className="font-mono text-sm text-muted-foreground md:group-hover:text-background transition-colors duration-300"
                  animate={{ x: hovered === i ? 4 : 0 }}
                  transition={{ duration: 0.3 }}
                  aria-hidden
                >
                  →
                </motion.span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Cursor-following preview card (desktop only) */}
      <AnimatePresence>
        {hovered !== null && typeof window !== "undefined" && window.innerWidth >= 768 && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed pointer-events-none z-50 w-56 h-72 overflow-hidden shadow-2xl"
            style={{ left: pos.x + 24, top: pos.y - 100 }}
            aria-hidden
          >
            {projects[hovered] && (
              // Raw <img>: decorative cursor preview.
              <img src={projects[hovered].image} alt="" className="w-full h-full object-cover" loading="eager" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {projects.length === 0 && (
        <p className="py-16 text-center font-body text-muted-foreground">No projects here yet — check back soon.</p>
      )}
    </div>
  );
}
