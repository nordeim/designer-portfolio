"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

/** The margin option type of useInView, derived from the source of truth. */
type ViewMargin = NonNullable<Parameters<typeof useInView>[1]>["margin"];

/**
 * Generic reveal wrapper: fades content up once it scrolls into view —
 * the reference app's standard section entrance (opacity 0, y 30 → 0.6s).
 * Render-safe under prefers-reduced-motion (transform suppressed).
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  margin = "-60px",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  margin?: ViewMargin;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={`${className ?? ""} motion-reduce:!transform-none`}
    >
      {children}
    </motion.div>
  );
}
