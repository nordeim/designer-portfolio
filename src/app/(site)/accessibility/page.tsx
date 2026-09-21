import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = pageMetadata({
  title: "Accessibility",
  description: "This portfolio's commitment to WCAG 2.2 Level AA accessibility and how to report barriers.",
  path: "/accessibility",
});

/**
 * Accessibility statement — mirrors the reference app's section anatomy
 * (statement / what accessibility is / adjustments / partial compliance /
 * arrangements / requests, plus the adjustments checklist) with this site's
 * real, verifiable practices instead of the reference's unfilled template
 * placeholders.
 */
const ADJUSTMENTS = [
  "Audited the site with automated accessibility tooling and browser-level checks to find and fix potential accessibility issues",
  "Set the language of the site",
  "Set the content order of the site's pages",
  "Defined clear heading structures on all of the site's pages",
  "Added alternative text to images",
  "Implemented color combinations that meet the required color contrast",
  "Reduced the use of motion on the site (all animation pauses under prefers-reduced-motion)",
  "Ensured all videos, audio, and files on the site are accessible (muted, looping, keyboard-reachable gallery media)",
];

export default function AccessibilityPage() {
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-16 md:pb-24"
      aria-label="Accessibility statement"
    >
      <p className="label-mono text-muted-foreground mb-6">LEGAL</p>
      <h1 className="font-body text-5xl md:text-6xl font-light tracking-tight text-foreground mb-16">
        Accessibility
      </h1>
      <div className="max-w-3xl flex flex-col gap-8 font-body text-sm md:text-base leading-relaxed text-foreground">
        <p>
          This portfolio is a design showcase, and design is only finished when everyone can use it. The statement
          below describes the accessibility measures this site takes, the standards it targets, and how to reach the
          owner if something is still in your way.
        </p>

        <section aria-label="Accessibility Statement">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">Accessibility Statement</h2>
          <p>This statement was last updated on September 21, 2026.</p>
          <p>
            We at {SITE.name} are working to make this site (designer-portfolio) accessible to people with
            disabilities. Accessibility is treated as a functional requirement here, not an afterthought — barriers
            reported by visitors are triaged as bugs.
          </p>
        </section>

        <section aria-label="What web accessibility is">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">What web accessibility is</h2>
          <p>
            An accessible site allows visitors with disabilities to browse the site with the same or a similar level
            of ease and enjoyment as other visitors. This can be achieved through the capabilities of the system on
            which the site is operating, and through assistive technologies such as screen readers and keyboard-only
            navigation. This site is built to support both.
          </p>
        </section>

        <section aria-label="Accessibility adjustments on this site">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">
            Accessibility adjustments on this site
          </h2>
          <p>
            We have adapted this site in accordance with WCAG 2.2 guidelines and have made the site accessible to
            the level of AA. This site&apos;s contents have been adapted to work with assistive technologies, such
            as screen readers and keyboard use. As part of this effort, we have also:
          </p>
          <ul
            className="flex flex-col gap-2 list-disc pl-6"
            aria-label="Accessibility adjustments"
          >
            {ADJUSTMENTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-label="Declaration of partial compliance with the standard due to third-party content">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">
            Declaration of partial compliance with the standard due to third-party content
          </h2>
          <p>
            The accessibility of certain pages on the site depends on contents that do not belong to the
            organization, such as embedded third-party media or externally hosted fonts. While the site itself meets
            the stated guidelines, the accessibility of such third-party content cannot be guaranteed by this
            declaration.
          </p>
        </section>

        <section aria-label="Accessibility arrangements in the organization">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">
            Accessibility arrangements in the organization
          </h2>
          <p>
            This portfolio is operated as an independent, remote design studio; there are no physical public
            premises or service counters whose accessibility arrangements would apply. All visitor interaction
            happens through this website and email.
          </p>
        </section>

        <section aria-label="Requests, issues and suggestions">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">
            Requests, issues and suggestions
          </h2>
          <p>
            If you find an accessibility issue on the site, or if you require further assistance, you are welcome to
            contact us. Reports are treated as bugs and answered as soon as possible.
          </p>
          <p>
            Email:{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-cobalt underline underline-offset-4 hover:text-foreground transition-colors"
            >
              {SITE.email}
            </a>
          </p>
        </section>
      </div>
    </section>
  );
}
