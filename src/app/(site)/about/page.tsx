import type { Metadata } from "next";
import { FadeIn } from "@/components/site/fade-in";
import { EXPERIENCE, SKILL_GROUPS, SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Alex Moreau — a Berlin-based graphic designer specializing in brand identity, building visual systems from first sketch to final print file.",
};

const PORTRAIT = "/about-portrait.jpg";

/**
 * About page: portrait + intro statement, the experience & education
 * timeline, and the software proficiency matrix with sage dots — matching
 * the reference app's /about route.
 */
export default function AboutPage() {
  return (
    <div className="pt-24 md:pt-32">
      {/* ---------------------------------------------------- Intro */}
      <section className="px-6 md:px-8 pb-24 md:pb-40" aria-label="About">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          <FadeIn className="md:col-span-5">
            <div className="aspect-[3/4] overflow-hidden">
              {/* Raw <img>: portrait with intrinsic ratio. */}
              <img
                src={PORTRAIT}
                alt={`Alex Moreau — portrait`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </FadeIn>
          <FadeIn className="md:col-start-7 md:col-span-6 flex flex-col justify-end" delay={0.2}>
            <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">About</span>
            <h1 className="font-body text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-8 leading-tight">
              Brands that mean
              <br />
              <span className="text-muted-foreground">something.</span>
            </h1>
            <p className="font-body text-lg leading-relaxed text-muted-foreground mb-6">
              I&apos;m Alex Moreau, a graphic designer based in Berlin specializing in brand identity. Over the past
              decade, I&apos;ve built visual systems for cafés, fashion labels, startups, and cultural institutions —
              from the first sketch to the final print file.
            </p>
            <p className="font-body text-lg leading-relaxed text-muted-foreground">
              My work lives at the intersection of strategy and craft. I believe a strong brand isn&apos;t just a logo —
              it&apos;s a system of decisions, each one deliberate, each one communicating something true about the
              people behind it.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* --------------------------------------- Experience & education */}
      <section className="px-6 md:px-8 py-24 md:py-32" aria-label="Experience">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground block mb-12">
              Experience &amp; Education
            </h2>
          </FadeIn>
          <div>
            {EXPERIENCE.map((item, i) => (
              <FadeIn key={item.period + item.role} delay={i * 0.1} margin="-60px">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8">
                  <div className="md:col-span-3">
                    <span className="font-mono text-xs tracking-widest text-muted-foreground">{item.period}</span>
                  </div>
                  <div className="md:col-span-9">
                    <h3 className="font-body text-lg font-medium text-foreground mb-2">{item.role}</h3>
                    <p className="font-body text-base text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------- Software & proficiency */}
      <section className="px-6 md:px-8 py-24 md:py-32" aria-label="Technical proficiency">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground block mb-12">
              Software &amp; Technical Proficiency
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              {SKILL_GROUPS.map((group) => (
                <div key={group.title}>
                  <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-4">
                    {group.title}
                  </span>
                  <div className="space-y-2">
                    {group.skills.map((skill) => (
                      <div key={skill} className="flex items-center gap-3 py-2">
                        <div className="w-1.5 h-1.5 bg-sage rounded-full flex-shrink-0" aria-hidden />
                        <span className="font-body text-sm text-foreground">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
