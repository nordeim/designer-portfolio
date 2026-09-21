"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { WORKS_INDEX_TOTAL } from "@/lib/site-config";

export interface WorkRowProject {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  heroImage: string;
}

/**
 * One Selected Works row: an alternating editorial layout — even rows carry
 * the sticky parallax image on the left with the text block on the right,
 * odd rows mirror it. The image floats with scroll progress (y 100→−100,
 * opacity 0→1→1→0), gains a charcoal gradient overlay and a giant index
 * numeral on hover. Mirrors the reference app's project rows.
 */
function WorkRow({ project, index }: { project: WorkRowProject; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, { once: true, margin: "-100px" });
  const even = index % 2 === 0;
  const { scrollYProgress } = useScroll({ target: rowRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const id = String(project.order).padStart(2, "0");

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
    >
      <Link
        href={`/project/${project.slug}`}
        className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start focus:outline-none"
      >
        <motion.div
          style={{ y, opacity }}
          className={`${
            even ? "md:col-start-1 md:col-span-7" : "md:col-start-5 md:col-span-8"
          } overflow-hidden relative md:sticky md:top-24 motion-reduce:!opacity-100 motion-reduce:!transform-none`}
        >
          <div className="image-hover-zone group/img relative overflow-hidden aspect-[4/5]">
            {/* Raw <img>: hover-preview imagery with a JS-driven transform. */}
            {/* The reference eases the hover scale with cubic-bezier(0.65, 0, 0.35, 1). */}
            {/* Tailwind v4's scale-105 animates the `scale` property, which */}
            {/* `transition-transform` covers — an inline `transition` shorthand */}
            {/* would drop `scale` from the property list and snap (session 24). */}
            <img
              src={project.heroImage}
              alt={`${project.title} — ${project.subtitle}`}
              className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/img:scale-105 motion-reduce:transition-none"
              loading="lazy"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 image-overlay"
              style={{
                background:
                  "linear-gradient(to top, rgba(18, 18, 18, 0.85) 0%, rgba(18, 18, 18, 0.3) 50%, rgba(18, 18, 18, 0) 100%)",
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 image-id-label"
              aria-hidden
            >
              <span className="font-body text-8xl md:text-9xl font-light text-white tracking-tighter select-none">
                {id}
              </span>
            </div>
          </div>
        </motion.div>

        <div
          className={`${
            even ? "md:col-start-9 md:col-span-4" : "md:col-start-1 md:col-span-4 md:row-start-1"
          } flex flex-col justify-end py-4`}
        >
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-2">
            {id}/{WORKS_INDEX_TOTAL} — {project.year}
          </span>
          <h3 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground group-hover:text-cobalt transition-colors duration-300 mb-2">
            {project.title}
          </h3>
          <p className="font-body text-sm text-muted-foreground mb-3">{project.subtitle}</p>
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {project.category}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * The Selected Works section: label + display heading, three alternating
 * project rows with generous spacing, and the large gradient "All Projects"
 * link. Mirrors the reference app's section structure.
 */
export function WorksSection({ projects }: { projects: WorkRowProject[] }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-40 px-6 md:px-8" aria-label="Selected Works">
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 30 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-16 md:mb-24"
      >
        <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
          Selected Works
        </span>
        <h2 className="font-body text-4xl md:text-6xl font-light tracking-tight text-foreground max-w-[60%]">
          Selected projects that define <span>my design perspective</span>
        </h2>
      </motion.div>

      <div className="space-y-20 md:space-y-32">
        {projects.map((project, i) => (
          <WorkRow key={project.slug} project={project} index={i} />
        ))}
      </div>

      <div className="mt-20 md:mt-32">
        <Link
          href="/projects"
          className="font-mono text-2xl md:text-3xl tracking-widest uppercase font-light pb-1 focus:outline-none animated-gradient-text"
        >
          All Projects →
        </Link>
      </div>
    </section>
  );
}
