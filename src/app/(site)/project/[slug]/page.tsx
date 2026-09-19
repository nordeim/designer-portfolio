import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProjectBySlug, getProjectNeighbours, getPublishedProjects } from "@/lib/data";
import { ProjectGallery } from "@/components/site/project-gallery";
import { MarqueeBand } from "@/components/site/marquee-band";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — ${project.subtitle}`,
    description: project.objective,
    openGraph: {
      title: `${project.title} — ${project.subtitle}`,
      description: project.objective,
      images: [{ url: project.heroImage }],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = await getProjectNeighbours(slug);
  const total = (await getPublishedProjects()).length;

  const gallery = [
    { kind: "image" as const, src: project.heroImage, alt: `${project.title} — hero` },
    ...project.gallery,
  ];

  return (
    <>
      {/* ------------------------------------------------ Hero */}
      <section className="relative" aria-label="Project hero">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40">
          <p className="label-mono text-muted-foreground mb-6">
            {String(project.order).padStart(2, "0")}/{String(total).padStart(2, "0")} — {project.category.toUpperCase()}
          </p>
          <h1 className="font-body font-light tracking-[-0.02em] leading-[0.95] text-[clamp(3.5rem,10vw,8.5rem)] text-foreground">
            {project.title}
          </h1>

          <div className="mt-8 md:mt-10 grid grid-cols-12 gap-8 items-end pb-10 md:pb-16">
            <div className="col-span-12 md:col-span-5">
              <h2 className="font-body text-xl md:text-2xl font-light text-foreground">{project.subtitle}</h2>
            </div>
            <dl className="col-span-12 md:col-span-7 grid grid-cols-3 gap-6">
              <div>
                <dt className="label-mono text-muted-foreground mb-2">ROLE</dt>
                <dd className="font-body text-sm text-foreground">{project.role}</dd>
              </div>
              <div>
                <dt className="label-mono text-muted-foreground mb-2">YEAR</dt>
                <dd className="font-body text-sm text-foreground">{project.year}</dd>
              </div>
              <div>
                <dt className="label-mono text-muted-foreground mb-2">OBJECTIVE</dt>
                <dd className="font-body text-sm text-foreground leading-relaxed">{project.objective}</dd>
              </div>
            </dl>
          </div>

          <div className="mb-10 md:mb-16">
            <ProjectGallery media={gallery} title={project.title} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Narrative */}
      <section className="mx-auto max-w-[1400px] px-6 md:px-10 pb-16 md:pb-24" aria-label="Project narrative">
        <div className="border-t border-border pt-10 md:pt-16 grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-3">
            <p className="label-mono text-cobalt">{project.category.toUpperCase()}</p>
            <h2 className="font-body text-2xl md:text-4xl font-light tracking-tight text-foreground mt-4">
              {project.tagline}
            </h2>
          </div>

          <div className="col-span-12 md:col-span-6 flex flex-col gap-8">
            <p className="font-body text-base md:text-lg leading-relaxed text-foreground">{project.description}</p>
            <div className="grid gap-8">
              <section>
                <h3 className="label-mono text-muted-foreground mb-3">THE PROBLEM</h3>
                <p className="font-body text-base leading-relaxed text-muted-foreground">{project.problem}</p>
              </section>
              <section>
                <h3 className="label-mono text-muted-foreground mb-3">THE SOLUTION</h3>
                <p className="font-body text-base leading-relaxed text-muted-foreground">{project.solution}</p>
              </section>
            </div>
          </div>

          <aside className="col-span-12 md:col-span-3 flex flex-col gap-10">
            <section>
              <h3 className="label-mono text-muted-foreground mb-4">DELIVERABLES</h3>
              <ul className="space-y-2">
                {project.deliverables.map((d) => (
                  <li key={d} className="font-body text-sm text-foreground flex items-baseline gap-3">
                    <span aria-hidden className="text-cobalt">
                      —
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="label-mono text-muted-foreground mb-4">OUTCOMES</h3>
              <ul className="space-y-3">
                {project.outcomes.map((o) => (
                  <li key={o} className="font-body text-sm text-muted-foreground leading-relaxed">
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------ Process */}
      <MarqueeBand />

      {project.processImage && (
        <section className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24" aria-label="Process">
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 md:col-span-4">
              <h2 className="label-mono text-muted-foreground mb-6">PROCESS</h2>
              <p className="font-body text-base md:text-lg leading-relaxed text-foreground">{project.process}</p>
            </div>
            <figure className="col-span-12 md:col-span-8">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-card">
                <img
                  src={project.processImage}
                  alt={`${project.title} — process`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </figure>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ Prev / next */}
      <nav
        className="border-t border-border"
        aria-label="Project navigation"
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {prev && (
            <Link
              href={`/project/${prev.slug}`}
              className="group py-10 md:py-14 md:pr-10 flex items-center gap-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <ArrowLeft
                className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:-translate-x-1 group-hover:text-cobalt"
                aria-hidden
              />
              <span className="flex flex-col gap-1">
                <span className="label-mono text-muted-foreground">PREVIOUS PROJECT</span>
                <span className="font-body text-lg md:text-2xl font-light text-foreground transition-colors group-hover:text-cobalt">
                  {prev.title}
                </span>
                <span className="font-body text-sm text-muted-foreground">{prev.subtitle}</span>
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={`/project/${next.slug}`}
              className="group py-10 md:py-14 md:pl-10 flex items-center justify-end gap-6 text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="flex flex-col gap-1 items-end">
                <span className="label-mono text-muted-foreground">NEXT PROJECT</span>
                <span className="font-body text-lg md:text-2xl font-light text-foreground transition-colors group-hover:text-cobalt">
                  {next.title}
                </span>
                <span className="font-body text-sm text-muted-foreground">{next.subtitle}</span>
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-cobalt"
                aria-hidden
              />
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
