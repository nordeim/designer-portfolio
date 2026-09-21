import Link from "next/link";
import { GhostMarquee } from "@/components/site/ghost-marquee";
import { MARQUEE_ITEMS, NAV_LINKS, SOCIAL_LINKS, SITE } from "@/lib/site-config";

/**
 * Site footer: the giant ghost marquee band on top, then four link columns
 * (Navigation / Social / Contact / Legal) and the copyright line — matching
 * the reference app's footer structure. The copyright string intentionally
 * reproduces the reference site's copy (including its "Built on Base44."
 * attribution) so the clone renders identically; this codebase is an
 * independent Next.js implementation (see README).
 */
export function SiteFooter() {
  return (
    <footer className="relative py-16 md:pt-24 md:pb-[26px] overflow-hidden">
      <div className="space-y-4 mb-8 md:mb-24">
        <GhostMarquee items={MARQUEE_ITEMS} />
      </div>

      <div className="px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 lg:gap-8 mb-12 md:mb-16">
          <nav aria-label="Footer navigation">
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Navigation</h3>
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="ml-[15px] md:ml-0" aria-label="Social links">
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Social</h3>
            <div className="flex flex-col gap-3">
              {SOCIAL_LINKS.slice(0, 3).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div aria-label="Contact details">
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Contact</h3>
            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${SITE.email}`}
                className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
              >
                {SITE.email}
              </a>
              <span className="font-body text-sm text-muted-foreground">Berlin, Germany</span>
            </div>
          </div>

          <div aria-label="Legal">
            <h3 className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-4">Legal</h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/privacy"
                className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
              >
                Privacy Policy
              </Link>
              <Link
                href="/accessibility"
                className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
              >
                Accessibility Statement
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4 pt-8 md:pt-0 border-t border-border md:border-t-0">
          <span className="font-mono text-xs text-muted-foreground">
            © {SITE.copyrightYear} Alex Moreau. Built on Base44.
          </span>
        </div>
      </div>
    </footer>
  );
}
