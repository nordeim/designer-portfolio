import Image from "next/image";
import Link from "next/link";
import { getFeaturedProjects, getPublishedProjects } from "@/lib/data";
import { SITE } from "@/lib/site-config";
import { ParticleField } from "@/components/site/particle-field";
import { MarqueeBand } from "@/components/site/marquee-band";
import { ArrowRight } from "lucide-react";

/**
 * Landing page: hero (name + meta + cover image), Selected Works index,
 * Design Philosophy, and the marquee band. Server-rendered; only the
 * project index and header are interactive client islands.
 */
export default async function HomePage() {
  const [featured, all] = await Promise.all([getFeaturedProjects(3), getPublishedProjects()]);
  const total = all.length;
  const heroImage = all[0]?.coverImage;

  return (
    <>
      {/* ------------------------------------------------ Introduction */}
      <section className="relative grid-lines" aria-label="Introduction">
        <ParticleField />
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="pt-28 md:pt-40 pb-16 md:pb-24 grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-7">
              <h1 className="font-body font-light tracking-[-0.03em] leading-[0.92] text-[clamp(4rem,12vw,10.5rem)] text-foreground">
                Alex
                <br />
                Moreau
              </h1>
              <div className="mt-8 md:mt-12 flex flex-wrap gap-x-10 gap-y-3">
                <span className="label-mono text-muted-foreground">{SITE.role}</span>
                <span className="label-mono text-muted-foreground">{SITE.basedIn}</span>
                <a
                  href={`mailto:${SITE.email}`}
                  className="label-mono text-muted-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SITE.email.toUpperCase()}
                </a>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 md:col-start-9 flex flex-col gap-4">
              {heroImage && (
                <figure className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-card">
                  <Image
                    src={heroImage}
                    alt={`${SITE.name} — selected work cover`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </figure>
              )}
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring self-end"
              >
                START A PROJECT
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Selected works */}
      <section className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24" aria-label="Selected Works">
        <div className="flex items-baseline justify-between mb-8 md:mb-12">
          <h2 className="label-mono text-muted-foreground">SELECTED WORKS</h2>
        </div>
        <h3 className="font-body text-2xl md:text-4xl font-light tracking-tight text-foreground max-w-2xl mb-10 md:mb-16">
          Selected projects that define my design perspective
        </h3>

        <ul className="divide-y divide-border border-y border-border">
          {featured.map((p) => (
            <li key={p.id}>
              <Link
                href={`/project/${p.slug}`}
                className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start py-8 md:py-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span className="md:col-span-1 label-mono text-muted-foreground transition-colors group-hover:text-cobalt">
                  {String(p.order).padStart(2, "0")}
                </span>
                <span className="md:col-span-5 flex flex-col gap-1">
                  <span className="font-body text-2xl md:text-3xl font-light tracking-tight text-foreground transition-colors group-hover:text-cobalt">
                    {p.title}
                  </span>
                  <span className="font-body text-sm md:text-base text-muted-foreground">{p.subtitle}</span>
                </span>
                <span className="hidden md:block md:col-span-3 label-mono text-muted-foreground transition-colors group-hover:text-cobalt">
                  {p.category}
                </span>
                <span className="hidden md:flex md:col-span-2 items-baseline gap-3 label-mono text-muted-foreground transition-colors group-hover:text-cobalt">
                  {String(p.order).padStart(2, "0")}/{String(total).padStart(2, "0")} — {p.year}
                </span>
                <span className="hidden md:flex md:col-span-1 justify-end">
                  <span className="font-mono text-sm text-muted-foreground transition-all duration-300 group-hover:text-cobalt group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 md:mt-14">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-3 label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            ALL PROJECTS
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------ Philosophy */}
      <MarqueeBand />

      <section className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24" aria-label="Design Philosophy">
        <h2 className="label-mono text-muted-foreground mb-8 md:mb-12">DESIGN PHILOSOPHY</h2>
        <p className="font-body text-xl md:text-3xl font-light leading-relaxed tracking-tight text-foreground max-w-4xl">
          {SITE.philosophy}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-6 md:gap-10">
          <Link
            href="/about"
            className="group inline-flex items-center gap-3 label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            READ MY STORY
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            START A CONVERSATION
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
