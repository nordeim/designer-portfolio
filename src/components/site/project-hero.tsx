"use client";

import { motion } from "framer-motion";
import { WORKS_INDEX_TOTAL } from "@/lib/site-config";

export interface HeroProject {
  order: number;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  role: string;
  objective: string;
  heroImage: string;
}

/** The Role/Year/Objective grid — on mobile over the page, on desktop inside the dark hero. */
export function ProjectMeta({ project }: { project: HeroProject }) {
  const label = "font-mono text-xs tracking-widest uppercase text-charcoal/60 md:text-gallery/60 block mb-3";
  const value = "font-body text-base text-charcoal md:text-gallery";
  return (
    <section className="pt-10 md:pt-0">
      <div className="grid grid-cols-12 gap-x-4 md:gap-x-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="col-start-2 col-span-10 grid grid-cols-1 md:grid-cols-4 gap-0 motion-reduce:!transform-none"
        >
          <div>
            <span className={label}>Role</span>
            <p className={value}>{project.role}</p>
          </div>
          <div>
            <span className={label}>Year</span>
            <p className={value}>{project.year}</p>
          </div>
          <div className="md:col-span-2">
            <span className={label}>Objective</span>
            <p className={`${value} leading-relaxed`}>{project.objective}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * The full-bleed project hero: cover image under a charcoal gradient with
 * the index/category label, oversized title, subtitle, and (on desktop) the
 * meta grid anchored to the bottom. Mirrors the reference app's hero.
 */
export function ProjectHero({ project }: { project: HeroProject }) {
  const id = String(project.order).padStart(2, "0");
  return (
    <section
      className="min-h-screen flex flex-col justify-end pb-16 pt-24 relative overflow-hidden"
      aria-label="Project hero"
    >
      <div className="absolute inset-0 z-0">
        {/* Raw <img>: full-bleed hero art directed by its natural ratio. */}
        <img
          src={project.heroImage}
          alt={`${project.title} hero visual`}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" aria-hidden />
      </div>
      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          className="grid grid-cols-12 gap-x-4 md:gap-x-6 motion-reduce:!transform-none"
        >
          <div className="col-start-2 col-span-10 mb-4">
            <span className="font-mono text-xs tracking-widest uppercase text-gallery/60">
              {/* Single static fragment "/06 — " (session 30) — matches the
                  source's 3-node label texture ("01" + "/06 — " + category). */}
              {id}{`/${WORKS_INDEX_TOTAL} — `}{project.category}
            </span>
          </div>
          <h1 className="col-start-2 col-span-10 font-body text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter text-gallery leading-none mb-6">
            {project.title}
          </h1>
          <p className="col-start-2 col-span-5 font-body text-xl md:text-2xl font-light text-gallery/80 mb-4">
            {project.subtitle}
          </p>
        </motion.div>
        <div className="hidden md:block mt-12 col-start-2 col-span-10">
          <ProjectMeta project={project} />
        </div>
      </div>
    </section>
  );
}
