import { NextResponse } from "next/server";

/**
 * /sitemap.xml — byte-exact replica of the reference app's sitemap.
 *
 * The source (designer-portfolio.base44.app) ships exactly six routes in this
 * order — home (trailing slash), about, projects, contact, privacy,
 * accessibility — every entry `weekly`, priorities 1.0 (home) / 0.8 (the
 * rest), 4-space indentation, and no trailing newline. It deliberately omits
 * project detail pages; the clone matches (they stay SSG'd via
 * generateStaticParams and internally linked from the landing + archive).
 *
 * Implemented as a plain route handler instead of the `app/sitemap.ts`
 * metadata convention because the convention's serializer is fixed (flat,
 * unindented, trailing newline) — and because the static route set removes
 * the old DB dependency: during an outage the sitemap now serves exactly
 * like the static shell instead of 500ing on getPublishedProjects().
 */

const ROUTES = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.8" },
  { path: "/projects", priority: "0.8" },
  { path: "/contact", priority: "0.8" },
  { path: "/privacy", priority: "0.8" },
  { path: "/accessibility", priority: "0.8" },
] as const;

export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const urls = ROUTES.map(
    (r) =>
      `    <url>\n        <loc>${siteUrl}${r.path}</loc>\n        <changefreq>weekly</changefreq>\n        <priority>${r.priority}</priority>\n    </url>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      // Mirrors the metadata route's cache posture: crawlable, cheap.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
