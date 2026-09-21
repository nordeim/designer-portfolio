import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: "How this portfolio collects, uses, and protects the personal information you share.",
  path: "/privacy",
});

/**
 * Privacy policy — mirrors the reference app's section anatomy (disclaimer /
 * basics / what is covered) while carrying this site's actual practices
 * instead of the reference's unfilled template placeholders.
 */
export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-16 md:pb-24" aria-label="Privacy policy">
      {/* The source's exact eyebrow texture (session 34): a SPAN storing
          title-case "Legal" — CSS uppercases it visually. The session-30
          marquee-class DOM texture; keep the tag/class/case exact. */}
      <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-6">Legal</span>
      <h1 className="font-body text-5xl md:text-6xl font-light tracking-tight text-foreground mb-16">
        Privacy Policy
      </h1>
      <div className="max-w-3xl flex flex-col gap-8 font-body text-sm md:text-base leading-relaxed text-foreground">
        <section aria-label="A legal disclaimer">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">A legal disclaimer</h2>
          <p>
            The explanations and information provided on this page describe the actual data practices of this
            portfolio in plain language. They are general information about how this specific site works, not legal
            advice for other websites or businesses. If you need advice on your own legal obligations, consult a
            qualified lawyer in your jurisdiction.
          </p>
        </section>

        <section aria-label="Privacy policy - the basics">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">Privacy Policy - the basics</h2>
          <p>
            This portfolio is a showcase for {SITE.name}&apos;s design work. The only personal information collected
            here is what you voluntarily submit through the project inquiry form: your name, email address, company,
            and the details of your message. This information is used solely to respond to your inquiry and is never
            sold, shared with third parties, or used for marketing.
          </p>
          <p>
            Different jurisdictions give visitors different rights over their data (access, correction, deletion).
            This site honors those rights: inquiry submissions are stored in the site&apos;s database and visible only
            to the site owner. You may request deletion of your inquiry at any time by emailing{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-cobalt underline underline-offset-4 hover:text-foreground transition-colors"
            >
              {SITE.email}
            </a>
            .
          </p>
        </section>

        <section aria-label="What is covered by this privacy policy">
          <h2 className="font-body text-xl font-medium text-foreground mb-4">
            What to include in the Privacy Policy
          </h2>
          <p>
            Generally speaking, a privacy policy addresses these types of issues — and here is how each one applies
            to this site: the types of information collected (inquiry form fields, described above) and the manner
            in which they are collected (voluntary submission only); why the information is collected (to reply to
            your project inquiry); the site&apos;s practices regarding sharing (none — no third parties, no
            advertising networks, no cross-site tracking); ways in which you can exercise your rights (email the
            owner for access or deletion); and the handling of minors&apos; data (this is a professional portfolio
            and not directed at minors, and no data is knowingly collected from them).
          </p>
          <p>
            Standard, privacy-respecting analytics may record anonymous page visits (no cross-site tracking, no
            advertising pixels). Sign-in sessions use a first-party, HttpOnly cookie that expires within 30 days; it
            contains no personal data beyond an opaque session token.
          </p>
          <p>
            For questions about this policy or your data, contact{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-cobalt underline underline-offset-4 hover:text-foreground transition-colors"
            >
              {SITE.email}
            </a>
            . This statement was last updated in 2026.
          </p>
        </section>
      </div>
    </section>
  );
}
