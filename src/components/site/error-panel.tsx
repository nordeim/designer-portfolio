import Link from "next/link";

/**
 * Shared degraded-experience panel. Rendered when a data-dependent surface
 * fails (e.g. a database outage): the site stays on-brand instead of
 * showing a bare "Internal Server Error". Server-component safe — no hooks;
 * interactive variants (error.tsx's reset button) pass their own actions.
 */
export function ErrorPanel({ actions }: { actions?: React.ReactNode }) {
  return (
    <main className="min-h-[60vh] bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center py-24">
        <p className="font-mono text-xs tracking-[0.1em] uppercase text-muted-foreground mb-6">
          Error — 500
        </p>
        <h1 className="font-body text-3xl md:text-4xl font-light tracking-tight mb-4">
          Something went wrong.
        </h1>
        <p className="font-body text-base text-muted-foreground mb-10">
          The page couldn&apos;t be loaded. This is usually temporary — please try
          again in a moment.
        </p>
        <div className="flex items-center justify-center gap-8">
          {actions ?? (
            <Link
              href="/"
              className="font-mono text-xs tracking-widest uppercase text-foreground hover:text-cobalt transition-colors border-b border-foreground/20 hover:border-cobalt pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
            >
              Back to home
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
