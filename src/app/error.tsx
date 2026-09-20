"use client";

/**
 * Root error boundary (App Router). When a page's data layer throws — e.g. a
 * database outage on a dynamic route — Next would otherwise render its bare
 * "Internal Server Error" page. This boundary keeps the failure visible but
 * on-brand: honest message, retry, and a path back to the public site. Error
 * details are deliberately not rendered (production never leaks internals).
 * Note: errors thrown from generateMetadata and the dynamicParams fallback
 * render path bypass React error boundaries — those call sites guard
 * themselves (see the project route page and the (site) layout).
 */
import { useEffect } from "react";
import Link from "next/link";
import { ErrorPanel } from "@/components/site/error-panel";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side observability hook: the digest is what production logs
    // correlate; the message itself is never shown to the visitor.
    console.error("[error-boundary]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <ErrorPanel
      actions={
        <>
          <button
            type="button"
            onClick={reset}
            className="font-mono text-xs tracking-widest uppercase text-foreground hover:text-cobalt transition-colors border-b border-foreground/20 hover:border-cobalt pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            Try again
          </button>
          <Link
            href="/"
            className="font-mono text-xs tracking-widest uppercase text-foreground hover:text-cobalt transition-colors border-b border-foreground/20 hover:border-cobalt pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            Back to home
          </Link>
        </>
      }
    />
  );
}
