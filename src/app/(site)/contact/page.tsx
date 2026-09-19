import type { Metadata } from "next";
import { FAQ_ITEMS, SITE, SOCIAL_LINKS } from "@/lib/site-config";
import { InquiryForm } from "@/components/site/inquiry-form";
import { MarqueeBand } from "@/components/site/marquee-band";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project with Alex Moreau — submit a project inquiry and get a detailed response within 48 hours.",
};

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-16 md:pb-24" aria-label="Contact">
        <p className="label-mono text-muted-foreground mb-6">CONTACT</p>
        <h1 className="font-body text-[clamp(2.5rem,7vw,5.5rem)] font-light tracking-[-0.02em] leading-[1.02] text-foreground max-w-4xl">
          Let&apos;s build something
          <br />
          remarkable together.
        </h1>
        <p className="mt-8 font-body text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Whether you have a detailed brief or just an idea, I&apos;d love to hear about your project. Fill out the
          form below and I&apos;ll get back to you within 48 hours.
        </p>

        <div className="mt-12 md:mt-16 grid grid-cols-12 gap-10 md:gap-16">
          {/* ---------------------------------------- Form */}
          <div className="col-span-12 lg:col-span-7" aria-label="Project inquiry">
            <p className="label-mono text-cobalt mb-8">PROJECT INQUIRY</p>
            <InquiryForm />
          </div>

          {/* ---------------------------------------- FAQ + contact info */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-14">
            <section aria-label="Frequently asked questions">
              <p className="label-mono text-muted-foreground mb-6">COLLABORATION FAQ</p>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
                    <AccordionTrigger className="text-left font-body text-sm md:text-base font-normal hover:no-underline hover:text-cobalt [&[data-state=open]]:text-cobalt">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section aria-label="Contact information" className="flex flex-col gap-8">
              <div className="flex items-start gap-4">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground shrink-0" aria-hidden />
                <div>
                  <p className="label-mono text-muted-foreground mb-1">EMAIL</p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {SITE.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" aria-hidden />
                <div>
                  <p className="label-mono text-muted-foreground mb-1">LOCATION</p>
                  <p className="font-body text-sm text-foreground">{SITE.location}</p>
                  <p className="font-body text-sm text-muted-foreground">{SITE.availability}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <ExternalLink className="h-4 w-4 mt-1 text-muted-foreground shrink-0" aria-hidden />
                <div>
                  <p className="label-mono text-muted-foreground mb-1">SOCIAL</p>
                  <ul className="space-y-2">
                    {SOCIAL_LINKS.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-sm text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {link.label} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <MarqueeBand />
    </>
  );
}
