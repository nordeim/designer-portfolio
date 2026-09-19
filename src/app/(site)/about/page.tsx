import type { Metadata } from "next";
import { EXPERIENCE, SKILL_GROUPS, SITE } from "@/lib/site-config";
import { MarqueeBand } from "@/components/site/marquee-band";

export const metadata: Metadata = {
  title: "About",
  description:
    "Alex Moreau — a Berlin-based graphic designer specializing in brand identity, building visual systems from first sketch to final print file.",
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-16 md:pb-24" aria-label="About">
        <p className="label-mono text-muted-foreground mb-6">ABOUT</p>
        <h1 className="font-body text-[clamp(2.5rem,7vw,5.5rem)] font-light tracking-[-0.02em] leading-[1.02] text-foreground max-w-4xl">
          Brands that mean
          <br />
          something.
        </h1>

        <div className="mt-10 md:mt-14 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7 flex flex-col gap-6">
            <p className="font-body text-base md:text-lg leading-relaxed text-foreground">
              I&apos;m Alex Moreau, a graphic designer based in Berlin specializing in brand identity. Over the past
              decade, I&apos;ve built visual systems for cafés, fashion labels, startups, and cultural institutions —
              from the first sketch to the final print file.
            </p>
            <p className="font-body text-base md:text-lg leading-relaxed text-foreground">
              My work lives at the intersection of strategy and craft. I believe a strong brand isn&apos;t just a logo —
              it&apos;s a system of decisions, each one deliberate, each one communicating something true about the
              people behind it.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9 flex flex-col gap-3 label-mono text-muted-foreground">
            <span>{SITE.role}</span>
            <span>{SITE.basedIn}</span>
            <a
              href={`mailto:${SITE.email}`}
              className="hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SITE.email.toUpperCase()}
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- Experience & education */}
      <section
        className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24 border-t border-border"
        aria-label="Experience and education"
      >
        <h2 className="label-mono text-muted-foreground mb-10 md:mb-14">EXPERIENCE & EDUCATION</h2>
        <ol className="divide-y divide-border border-y border-border">
          {EXPERIENCE.map((item) => (
            <li key={item.period + item.role} className="grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10">
              <span className="col-span-12 md:col-span-2 label-mono text-muted-foreground">{item.period}</span>
              <div className="col-span-12 md:col-span-4">
                <h3 className="font-body text-lg md:text-xl font-light tracking-tight text-foreground">
                  {item.role}
                </h3>
              </div>
              <p className="col-span-12 md:col-span-6 font-body text-sm md:text-base leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <MarqueeBand />

      {/* ------------------------------------------- Skills */}
      <section
        className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24"
        aria-label="Software and technical proficiency"
      >
        <h2 className="label-mono text-muted-foreground mb-10 md:mb-14">SOFTWARE & TECHNICAL PROFICIENCY</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {SKILL_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="label-mono text-cobalt mb-6">{group.title}</h3>
              <ul className="space-y-3">
                {group.skills.map((skill) => (
                  <li key={skill} className="font-body text-sm text-foreground">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
