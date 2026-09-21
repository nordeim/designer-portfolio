import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

/**
 * Per-route OpenGraph composition (session 28 parity).
 *
 * The reference serves og:url + canonical on every route and mirrors the
 * page title into og:title ("Contact | Designer Portfolio"). Next.js
 * replaces nested metadata objects wholesale — a page that sets
 * `openGraph` LOSES the root's siteName/locale/type/images — so every
 * route-level OG block is composed through this helper to stay complete.
 *
 * og:title uses the fully-composed form (the root title template does NOT
 * apply to OG fields). og:description keeps the clone's own page copy:
 * richer than the reference's "<Page> on <Site>. <site description>"
 * composition, invisible in the browser UI.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const composedTitle = `${opts.title} | ${SITE.title}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: composedTitle,
      description: opts.description,
      url: opts.path,
      siteName: SITE.title,
      locale: "en_US",
      type: "website",
      images: [{ url: "/icon.svg", width: 1200, height: 630, type: "image/svg+xml" }],
    },
    // The page-level twitter block must be re-stated too: without it the
    // ROOT's twitter.title ("Designer Portfolio") survives, and the card
    // stops mirroring the route (the source serves "Contact | …" here).
    // (twitter:url — which the source also ships — is not expressible in
    // Next's typed metadata API and is ignored by X's card parser; accepted
    // divergence, see docs.)
    twitter: {
      card: "summary_large_image",
      title: composedTitle,
      description: opts.description,
      images: ["/icon.svg"],
    },
  };
}
