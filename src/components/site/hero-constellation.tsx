"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  buildConstellation,
  dotFloatPattern,
  slotVisible,
  type ConstellationItem,
  type ConstellationSource,
} from "@/lib/constellation";
import { createTypewriter, startTyping, typewriterTick, type TypewriterState } from "@/lib/typewriter";

/** SSR-safe mobile media query via useSyncExternalStore. */
function useIsMobile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

/** Drives the pure typewriter machine with the reference's timers. */
function useTypewriter(items: readonly string[], active: boolean): TypewriterState {
  const [state, setState] = useState<TypewriterState>(() => createTypewriter(items));

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setState(startTyping), 600);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => {
    if (state.phase === "typing") {
      const t = setTimeout(() => setState(typewriterTick), 40);
      return () => clearTimeout(t);
    }
    if (state.phase === "pausing") {
      const t = setTimeout(() => setState(typewriterTick), 120);
      return () => clearTimeout(t);
    }
  }, [state]);

  return state;
}

/** The reference's float amplitude/duration table for the cobalt dots. */
function dotAnimation(id: number) {
  const rise = 12 + (id * 7 + 3) % 26;
  const pattern = dotFloatPattern(id);
  const y =
    pattern === "deep"
      ? [0, -rise, -rise, 0, 0, 0]
      : pattern === "mid"
        ? [0, -rise, 0, 0, 0]
        : [0, -rise, 0];
  return {
    y,
    times: pattern === "deep" ? [0, 0.25, 0.55, 0.75, 0.88, 1] : pattern === "mid" ? [0, 0.3, 0.6, 0.82, 1] : [0, 0.45, 1],
    duration: (pattern === "deep" ? 4.5 : pattern === "mid" ? 3.8 : 2.2) + ((id * 3 + 1) % 4) * 0.4,
    delay: ((id * 5 + 2) % 11) * 0.28,
  };
}

function ConstellationSlot({
  item,
  visible,
  onHover,
}: {
  item: ConstellationItem;
  visible: boolean;
  onHover: (id: number | null) => void;
}) {
  const reduced = useReducedMotion();
  const anim = dotAnimation(item.id);
  return (
    <div
      className="absolute z-20"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: "translate(-50%, -50%)",
        width: item.width,
        height: item.height,
      }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-0 bg-cobalt"
        style={{ width: "7.7px", height: "7.7px", marginLeft: "-3px" }}
        animate={reduced ? { y: 0 } : { y: anim.y }}
        transition={
          reduced
            ? { duration: 0, repeat: 0 }
            : {
                duration: anim.duration,
                times: anim.times,
                repeat: Infinity,
                ease: "easeInOut",
                delay: anim.delay,
              }
        }
        aria-hidden
      />
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-full h-full overflow-hidden pointer-events-none relative z-10"
            aria-hidden
          >
            {/* Raw <img>: decorative floating preview, not content imagery. */}
            <img
              src={item.src}
              alt=""
              loading="lazy"
              className={`w-full h-full ${item.contain ? "object-contain" : "object-cover"}`}
            />
            {!item.contain && <div className="absolute inset-0 bg-charcoal/10" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The landing hero: a full-screen "constellation" of floating project
 * previews (hover to pin one; otherwise a random one surfaces every few
 * seconds), anchored by animated cobalt dots, with the oversized name and
 * the typewriter meta line pinned to the left edge. Mirrors the reference
 * app's Introduction section.
 */
export function HeroConstellation({
  sources,
  extras,
  meta,
}: {
  sources: readonly ConstellationSource[];
  extras: { slot4: string; slot6: string };
  meta: readonly string[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true });
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [cycled, setCycled] = useState<number | null>(null);
  const lastCycled = useRef<number>(-1);

  const items = buildConstellation(sources, extras, isMobile);
  const typewriter = useTypewriter(meta, inView && !reduced);
  const lines = reduced
    ? { completed: meta, current: "", index: meta.length }
    : { completed: typewriter.completed, current: typewriter.current, index: typewriter.index };
  const typing = !reduced && typewriter.phase !== "finished" && typewriter.phase !== "waiting";

  // Random reveal cycling: after 800ms show a random item for 1.5–2.5s,
  // then wait 1.2–3s and repeat. Pauses silently while something is hovered
  // (matching the reference behavior).
  useEffect(() => {
    if (reduced) return;
    let show: ReturnType<typeof setTimeout>;
    let wait: ReturnType<typeof setTimeout>;
    const cycle = () => {
      if (hovered !== null) return;
      let id = Math.floor(Math.random() * items.length);
      while (id === lastCycled.current && items.length > 1) {
        id = Math.floor(Math.random() * items.length);
      }
      lastCycled.current = id;
      setCycled(id);
      show = setTimeout(() => {
        setCycled(null);
        wait = setTimeout(cycle, 1200 + Math.random() * 1800);
      }, 1500 + Math.random() * 1000);
    };
    wait = setTimeout(cycle, 800);
    return () => {
      clearTimeout(show);
      clearTimeout(wait);
    };
  }, [hovered, items.length, reduced]);

  const inline = lines.completed.slice(0, 2);
  const below = lines.completed.slice(2);

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden" aria-label="Introduction">
      {items.map((item) => (
        <ConstellationSlot
          key={item.id}
          item={item}
          visible={slotVisible({ id: item.id, hovered, cycled, reduced: reduced ?? false })}
          onHover={setHovered}
        />
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-0"
      >
        <h1
          className="hero-h1-scale font-body text-[106px] md:text-[141px] font-light tracking-tighter whitespace-nowrap text-left text-foreground"
          style={{ lineHeight: 0.82 }}
        >
          Alex
          <br />
          Moreau
        </h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="flex flex-col md:flex-row gap-2 md:gap-6 text-xs md:text-sm font-mono tracking-widest uppercase text-muted-foreground mt-8 leading-none"
        >
          <div className="flex gap-6 leading-tight">
            {inline.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
            {lines.index === 2 && typing && (
              <span>
                {lines.current}
                <span className="opacity-70">|</span>
              </span>
            )}
          </div>
          {below.map((line, i) => (
            <div key={i} className="-mt-1">
              {line}
            </div>
          ))}
          {lines.index > 2 && lines.index < meta.length && typing && (
            <span>
              {lines.current}
              <span className="opacity-70">|</span>
            </span>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
