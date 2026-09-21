import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { FadeIn } from "@/components/site/fade-in";
import { InquiryForm } from "@/components/site/inquiry-form";
import { FAQ_ITEMS, SOCIAL_LINKS, SITE } from "@/lib/site-config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Start a project with Alex Moreau — submit a project inquiry and get a detailed response within 48 hours.",
  path: "/contact",
});

/**
 * Contact page: display headline, the inquiry form, the collaboration FAQ,
 * and the contact information columns — matching the reference app's
 * /contact route.
 */
export default function ContactPage() {
  return (
    <div className="pt-24 md:pt-32">
      {/* ---------------------------------------------------- Headline */}
      <section className="px-6 md:px-8 pb-16 md:pb-24" aria-label="Contact">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
              Contact
            </span>
            <h1 className="font-body text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground mb-6 max-md:leading-tight">
              Let&apos;s build something
              <br />
              <span className="text-muted-foreground">remarkable together.</span>
            </h1>
            <p className="font-body text-lg text-muted-foreground max-w-2xl">
              Whether you have a detailed brief or just an idea, I&apos;d love to hear about your project. Fill out
              the form below and I&apos;ll get back to you within 48 hours.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ---------------------------------------------------- Inquiry */}
      <section className="px-6 md:px-8 py-16 md:py-24 border-t border-border" aria-label="Project inquiry form">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-8">
              Project Inquiry
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <InquiryForm />
          </FadeIn>
        </div>
      </section>

      {/* ---------------------------------------------------- FAQ */}
      <section className="px-6 md:px-8 py-16 md:py-24 border-t border-border" aria-label="Frequently asked questions">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-8">
              Collaboration FAQ
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  {/* Source-measured custom part: text-base (16px) font-medium,
                      py-6 (24px), hover underline + cobalt — not text-lg/300. */}
                  <AccordionTrigger className="font-body text-base text-foreground hover:text-cobalt py-6 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* The reference wraps the answer in a max-w-2xl (672px)
                        paragraph so the text column matches its measure. */}
                    <p className="font-body text-base text-muted-foreground leading-relaxed max-w-2xl">
                      {item.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>

      {/* ---------------------------------------------------- Info */}
      <section className="px-6 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24 border-t border-border" aria-label="Contact information">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <FadeIn>
              <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
                Email
              </span>
              <a
                href={`mailto:${SITE.email}`}
                className="font-body text-lg text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
              >
                {SITE.email}
              </a>
            </FadeIn>
            <FadeIn delay={0.1}>
              <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
                Location
              </span>
              <p className="font-body text-lg text-foreground">Berlin, Germany</p>
              <p className="font-body text-sm text-muted-foreground mt-1">Available for remote &amp; on-site</p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
                Social
              </span>
              <div className="flex flex-col gap-2">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-base text-foreground hover:text-cobalt transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4"
                  >
                    {`${link.label} ↗`}
                  </a>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
