import { useMemo } from "react";

/**
 * Deterministic scatter of cobalt dots over the hero, echoing the original's
 * floating particles. Positions come from a seeded PRNG (not Math.random) so
 * server and client render identical markup — no hydration mismatch.
 */
export function ParticleField({ count = 24 }: { count?: number }) {
  const dots = useMemo(() => {
    const rand = mulberry32(0x2e5b);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 4 + rand() * 92,
      top: 2 + rand() * 62,
      size: 2 + Math.round(rand() * 3),
      opacity: 0.35 + rand() * 0.5,
    }));
  }, [count]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-cobalt"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}

/** Small deterministic PRNG (mulberry32) for stable SSR/CSR output. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
