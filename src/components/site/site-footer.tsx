import Link from "next/link";
import { SITE, NAV_LINKS, SOCIAL_LINKS } from "@/lib/site-config";

/**
 * Site footer — four columns (Navigation / Social / Contact / Legal) over a
 * bordered surface, ending with the copyright line. Mirrors the original's
 * link set and labels.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          <nav className="col-span-2 md:col-span-3" aria-label="Footer navigation">
            <h3 className="label-mono text-muted-foreground mb-5">NAVIGATION</h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 md:col-span-3" aria-label="Social links">
            <h3 className="label-mono text-muted-foreground mb-5">SOCIAL</h3>
            <ul className="space-y-3">
              {SOCIAL_LINKS.slice(0, 3).map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3" aria-label="Contact details">
            <h3 className="label-mono text-muted-foreground mb-5">CONTACT</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="font-body text-sm text-muted-foreground">{SITE.location}</li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3" aria-label="Legal">
            <h3 className="label-mono text-muted-foreground mb-5">LEGAL</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Accessibility Statement
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p className="label-mono text-muted-foreground">{SITE.copyright}</p>
          <p className="label-mono text-muted-foreground/70">BERLIN — {SITE.availability.toUpperCase()}</p>
        </div>
      </div>
    </footer>
  );
}
