"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

/**
 * The Design Philosophy section: the oversized statement paragraph with a
 * slide-in reveal and two underlined mono links. Mirrors the reference
 * app's section, including the border-b link treatment.
 */
export function PhilosophySection({ philosophy }: { philosophy: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const textInView = useInView(textRef, { once: true, margin: "-40px" });
  const linksRef = useRef<HTMLDivElement>(null);
  const linksInView = useInView(linksRef, { once: true, margin: "-40px" });

  return (
    <section className="py-24 md:py-40 px-6 md:px-8" aria-label="Design Philosophy">
      <div>
        <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-8 md:mb-12">
          Design Philosophy
        </span>
        <div className="mb-16">
          {/* leading-none: the reference's leading-loose class is inert in
              its CSS bundle — the rendered line-height is 1.0. */}
          <div className="font-body text-2xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-none max-w-4xl">
            <motion.p
              ref={textRef}
              initial={{ opacity: 0, x: -16 }}
              animate={textInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
              className="motion-reduce:!transform-none"
            >
              {philosophy}
            </motion.p>
          </div>
        </div>
        <motion.div
          ref={linksRef}
          initial={{ opacity: 0, y: 20 }}
          animate={linksInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-6 items-start motion-reduce:!transform-none"
        >
          <Link
            href="/about"
            className="font-mono text-sm tracking-widest uppercase text-foreground hover:text-cobalt transition-colors duration-300 border-b border-foreground/20 hover:border-cobalt pb-1 focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
          >
            Read My Story →
          </Link>
          <Link
            href="/contact"
            className="font-mono text-sm tracking-widest uppercase text-foreground hover:text-cobalt transition-colors duration-300 border-b border-foreground/20 hover:border-cobalt pb-1 focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
          >
            Start a Conversation →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
