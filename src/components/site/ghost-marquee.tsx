"use client";

import { useRef, useState } from "react";

/**
 * The giant footer marquee: mono display type (36/60/96px) scrolling on a
 * 60s linear loop. Items rest at 10% opacity ("ghost" text); hovering an
 * item turns it cobalt and full-opacity while the others blur to 15%.
 * The animation pauses while hovered and resumes seamlessly. Mirrors the
 * reference app's footer band, including the dot separators.
 */
export function GhostMarquee({
  items,
  className = "",
}: {
  items: readonly string[];
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const onEnter = (i: number) => {
    setHovered(i);
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  };
  const onLeave = () => {
    setHovered(null);
    if (trackRef.current) trackRef.current.style.animationPlayState = "running";
  };

  // The loop needs the list duplicated so a -50% translate is seamless.
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden>
      <div ref={trackRef} className="marquee-track inline-flex will-change-transform">
        {loop.map((item, i) => {
          const dimmed = hovered !== null && hovered !== i;
          return (
            <span key={i} className="flex items-center">
              <span
                className="text-4xl md:text-6xl lg:text-8xl font-mono font-light tracking-tight uppercase select-none leading-none cursor-default transition-colors duration-200"
                onMouseEnter={() => onEnter(i)}
                onMouseLeave={onLeave}
              >
                <span
                  className="transition-all duration-300"
                  style={{
                    color: hovered === i ? "#2E5BFF" : undefined,
                    filter: dimmed ? "blur(4px)" : "none",
                    opacity: hovered === i ? 1 : dimmed ? 0.15 : 0.1,
                  }}
                >
                  {item}
                </span>
              </span>
              <span
                className="text-4xl md:text-6xl lg:text-8xl font-mono font-light text-foreground select-none leading-none mx-2 md:mx-4 transition-all duration-300"
                style={{ filter: hovered !== null ? "blur(4px)" : "none", opacity: hovered !== null ? 0.15 : 0.1 }}
              >
                ·
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
