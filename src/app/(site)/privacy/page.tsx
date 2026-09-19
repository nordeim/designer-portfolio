import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How this portfolio collects, uses, and protects the personal information you share.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-16 md:pb-24" aria-label="Privacy policy">
      <p className="label-mono text-muted-foreground mb-6">LEGAL</p>
      <h1 className="font-body text-4xl md:text-6xl font-light tracking-tight text-foreground mb-10">
        Privacy Policy
      </h1>
      <div className="max-w-3xl flex flex-col gap-8 font-body text-sm md:text-base leading-relaxed text-foreground">
        <p>
          This portfolio is a showcase for {SITE.name}&apos;s design work. The only personal information collected here
          is what you voluntarily submit through the project inquiry form: your name, email address, company, and the
          details of your message. This information is used solely to respond to your inquiry and is never sold,
          shared with third parties, or used for marketing.
        </p>
        <p>
          Inquiry submissions are stored in the site&apos;s database and visible only to the site owner. You may
          request deletion of your inquiry at any time by emailing{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-cobalt underline underline-offset-4 hover:text-foreground transition-colors"
          >
            {SITE.email}
            </a>
            .
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
      </div>
    </section>
  );
}
