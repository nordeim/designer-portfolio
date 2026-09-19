"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import type { MediaItem } from "@/lib/validation";

/**
 * Project media gallery. The first frame renders as a zoomable viewer
 * (scale 1–2, transform-origin follows the pointer); the rest render as an
 * editorial stagger grid. Videos render inline with controls.
 */
export function ProjectGallery({ media, title }: { media: MediaItem[]; title: string }) {
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  const [hero, ...rest] = media;

  function onPointerMove(e: React.MouseEvent) {
    if (zoom === 1) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      {hero && (
        <div>
          <div className="flex items-center justify-end gap-2 mb-3">
            <span className="label-mono text-muted-foreground mr-auto" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
              disabled={zoom <= 1}
              aria-label="Zoom out"
              className="border border-border p-2 text-foreground hover:border-cobalt hover:text-cobalt transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
              disabled={zoom >= 2}
              aria-label="Zoom in"
              className="border border-border p-2 text-foreground hover:border-cobalt hover:text-cobalt transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          <div
            ref={frameRef}
            onMouseMove={onPointerMove}
            className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-card cursor-zoom-in"
          >
            <Image
              src={hero.src}
              alt={hero.alt || `${title} — main visual`}
              fill
              priority
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
            />
          </div>
          <p className="label-mono text-muted-foreground mt-3">01 / {String(media.length).padStart(2, "0")}</p>
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
          {rest.map((item, i) => (
            <motion.figure
              key={item.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className={
                i % 5 === 0
                  ? "md:col-span-12"
                  : i % 5 === 1
                    ? "md:col-span-7"
                    : i % 5 === 2
                      ? "md:col-span-5"
                      : i % 5 === 3
                        ? "md:col-span-5"
                        : "md:col-span-7"
              }
            >
              {item.kind === "video" ? (
                <video
                  src={item.src}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={item.alt || `${title} — process video`}
                  className="w-full border border-border bg-card"
                />
              ) : (
                <>
                  <div
                    className={`relative w-full overflow-hidden border border-border bg-card ${
                      i % 5 === 0 ? "aspect-[16/9]" : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt || `${title} — detail ${i + 2}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className="object-cover"
                    />
                  </div>
                </>
              )}
              <figcaption className="label-mono text-muted-foreground mt-3">
                {String(i + 2).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      )}
    </div>
  );
}
