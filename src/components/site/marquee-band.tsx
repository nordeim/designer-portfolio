import { MARQUEE_ITEMS } from "@/lib/site-config";

/**
 * The endlessly-scrolling skills band. The track renders the item list twice;
 * `marquee-track` translates it by -50% on a loop so the seam is invisible.
 * Motion is disabled under prefers-reduced-motion (see globals.css).
 */
export function MarqueeBand() {
  const items = MARQUEE_ITEMS;
  return (
    <section aria-hidden className="overflow-hidden border-y border-border py-4 md:py-5 select-none">
      <div className="marquee-track flex items-center whitespace-nowrap will-change-transform">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center shrink-0">
            {items.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center">
                <span className="label-mono text-foreground">{item}</span>
                <span className="mx-6 text-muted-foreground" aria-hidden>
                  ·
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
