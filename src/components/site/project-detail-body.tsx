"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "framer-motion";
import type { MediaItem } from "@/lib/validation";

export interface DetailProject {
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  role: string;
  objective: string;
  tagline: string;
  description: string;
  heroImage: string;
  coverImage: string;
  gallery: MediaItem[];
}

export interface NavLinkProject {
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
}

/** Zoom state: 1 = single full-width column, 2 = two-column mosaic. */
type Zoom = 1 | 2;

/** One gallery frame — videos autoplay muted and loop, images lazy-load. */
function GalleryItem({ item, className, title }: { item: MediaItem; className: string; title: string }) {
  return (
    <div className="w-full">
      {item.kind === "video" ? (
        <video
          src={item.src}
          autoPlay
          muted
          loop
          playsInline
          aria-label={item.alt || `${title} — process video`}
          className={className}
        />
      ) : (
        // Raw <img>: full-bleed editorial frames sized by their natural ratio.
        <img src={item.src} alt={item.alt || `${title} — detail`} loading="lazy" className={className} />
      )}
    </div>
  );
}

/** A circular zoom toggle that docks fixed once the gallery is on screen. */
function ZoomToggle({ zoom, setZoom, docked }: { zoom: Zoom; setZoom: (z: Zoom) => void; docked: boolean }) {
  const btn = (active: boolean) => `flex items-center justify-center w-5 h-5 transition-colors duration-200 ${
    active ? "text-cobalt" : "text-muted-foreground hover:text-foreground"
  }`;
  return (
    <div
      className={`hidden md:flex items-center gap-2 bg-white/50 backdrop-blur-md px-2 py-2 rounded-xl ${
        docked ? "fixed bottom-8 right-8 z-30" : "sticky bottom-8"
      }`}
      style={{ transform: "translateY(-25px)" }}
    >
      <button type="button" onClick={() => setZoom(1)} className={btn(zoom === 1)} aria-label="Zoom in" title="Zoom in">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="6" y1="3" x2="6" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" onClick={() => setZoom(2)} className={btn(zoom === 2)} aria-label="Zoom out" title="Zoom out">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Prev/next link with the cobalt dot and a hover image preview. */
function ProjectNavLink({ project, label, align }: { project: NavLinkProject; label: string; align: "left" | "right" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/project/${project.slug}`}
      className={`flex flex-col gap-3 group focus:outline-none ${
        align === "right" ? "items-end" : "items-start"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative flex-shrink-0 order-first">
        <div
          className="rounded-full bg-cobalt transition-transform duration-300 group-hover:scale-125"
          style={{ width: "7.7px", height: "7.7px" }}
          aria-hidden
        />
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute z-50 w-48 h-64 overflow-hidden pointer-events-none ${
                align === "right" ? "right-4 bottom-4" : "left-4 bottom-4"
              }`}
              aria-hidden
            >
              {/* Raw <img>: decorative hover preview. */}
              <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={align === "right" ? "text-right" : "text-left"}>
        <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-2">{label}</span>
        <span className="font-body text-lg md:text-2xl font-light tracking-tight text-foreground group-hover:text-cobalt transition-colors duration-300">
          {project.title}
        </span>
        <span className="font-mono text-xs text-muted-foreground block mt-0.5">{project.subtitle}</span>
      </div>
    </Link>
  );
}

/**
 * The project detail body: intro column + 1↔2-column gallery with
 * the circular zoom toggle, then the dot-styled prev/next navigation.
 * Mirrors the reference app's project route. Source-measured (session 26):
 * the reference wraps the intro in a GSAP pin-spacer whose pin never
 * engages — the intro scrolls AWAY with the page (no CSS sticky), and
 * the h2 uses the default text-3xl line-height (36px), not leading-snug.
 */
export function ProjectDetailBody({
  project,
  prev,
  next,
}: {
  project: DetailProject;
  prev: NavLinkProject | null;
  next: NavLinkProject | null;
}) {
  const [zoom, setZoom] = useState<Zoom>(1);
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryInView = useInView(galleryRef, { margin: "0px" });

  const itemClass = `w-full h-auto ${zoom === 2 ? "mb-4 break-inside-avoid" : ""}`;
  const galleryItems = project.gallery.length > 0 ? project.gallery : [{ kind: "image" as const, src: project.heroImage, alt: `${project.title} — hero` }];

  return (
    <>
      <section className="px-6 md:px-8 py-24 md:py-32" aria-label="Project detail">
        {/* Mobile: intro + gallery stacked */}
        <div className="md:hidden mb-8">
          <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
            {project.category}
          </span>
          <h2 className="font-body text-3xl font-light tracking-tight text-foreground mb-8 leading-snug">
            {project.tagline}
          </h2>
          <p className="font-body text-base leading-relaxed text-muted-foreground">{project.description}</p>
        </div>
        <div className={`md:hidden mb-12 ${zoom === 2 ? "columns-2 gap-x-4" : "flex flex-col gap-4"}`}>
          {galleryItems.map((item, i) => (
            <GalleryItem key={`${item.src}-${i}`} item={item} className={itemClass} title={project.title} />
          ))}
        </div>

        {/* Desktop: pinned intro column + gallery (source parity).
            The reference pins the intro via GSAP ScrollTrigger
            (trigger = this section, start "top 10px", end "bottom bottom",
            pin = intro, pinSpacing false — extracted from its bundle). The
            section top sits 128px above the grid (py-32), so the pin engages
            at scroll 890 holding the intro at viewport y=138 — replicated
            here with CSS sticky. The source's pin END (section bottom at
            viewport bottom) releases ~294px before the grid's own bottom;
            CSS sticky is constrained by the grid, so ours holds a hair
            longer — documented divergence. */}
        <div className="hidden md:grid grid-cols-12 gap-16 relative">
          <div className="col-span-4 self-start md:sticky md:top-[138px]">
            <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
              {project.category}
            </span>
            <h2 className="font-body text-2xl md:text-3xl font-light tracking-tight text-foreground mb-8 leading-snug">
              {project.tagline}
            </h2>
            <p className="font-body text-base leading-relaxed text-muted-foreground">{project.description}</p>
          </div>
          <div
            ref={galleryRef}
            className={`col-span-8 ${zoom === 2 ? "columns-2 gap-x-4" : "flex flex-col gap-4"}`}
          >
            {galleryItems.map((item, i) => (
              <GalleryItem key={`${item.src}-${i}`} item={item} className={itemClass} title={project.title} />
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-8 md:mt-12">
          <ZoomToggle zoom={zoom} setZoom={setZoom} docked={galleryInView} />
        </div>
      </section>

      <section className="px-6 md:px-8 py-16 md:py-24" aria-label="Project navigation">
        <div className="flex items-start justify-between gap-12 md:gap-16">
          {prev && <ProjectNavLink project={prev} label="Previous Project" align="left" />}
          {next && <ProjectNavLink project={next} label="Next Project" align="right" />}
        </div>
      </section>
    </>
  );
}
