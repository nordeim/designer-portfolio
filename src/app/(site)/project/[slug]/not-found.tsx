import type { Metadata } from "next";

export const metadata: Metadata = {
  // Source parity: the reference SPA keeps the generic project-route title
  // for unknown slugs (the tab title does not change; only the body renders
  // "Project not found."). The honest 404 status stays (documented divergence).
  title: "Project Detail",
  robots: { index: false, follow: false },
};

/**
 * Unknown-project-slug boundary (renders inside the public site chrome —
 * header + footer marquee — unlike the standalone root 404). Mirrors the
 * reference app exactly: a single centered mono line, "Project not found.",
 * positioned mid-viewport between the fixed header and the marquee band.
 * The reference's SPA returns HTTP 200 here; we keep the honest 404 status
 * (SEO-correct divergence, visuals unaffected).
 */
export default function ProjectNotFound() {
  return (
    <section
      className="min-h-[calc(100svh-15rem)] grid place-items-center px-6"
      aria-label="Project not found"
    >
      <p className="font-mono text-sm text-muted-foreground">Project not found.</p>
    </section>
  );
}
