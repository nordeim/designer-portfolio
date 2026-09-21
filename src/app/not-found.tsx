"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Standalone 404 for unmatched routes (no site chrome — matches the
 * reference app's system screen). Source element stack, mapped to the
 * token system: 72px font-light muted "404", 24px font-medium
 * "Page Not Found", the quoted pathname in the message, and a flat white
 * "Go Home" button. The vertical rhythm replicates the reference's
 * measured flow (gaps of 34 / 12 / 48 px), which centers the column at
 * the exact same y-offsets. The pathname is client-side (usePathname) —
 * server rendering would ship a generic message to every unknown URL.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "";
  const quoted = pathname === "/" ? "this page" : `"${pathname}"`;

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6" aria-label="Page not found">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <h1 className="w-full font-body text-7xl font-light tracking-tight text-slate-300 mb-[34px]">404</h1>
        <h2 className="w-full font-body text-2xl font-medium text-slate-800 mb-3">Page Not Found</h2>
        <p className="w-full font-body text-base leading-relaxed text-slate-600 mb-12">
          The page {quoted} could not be found in this application.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1 bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-none hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
