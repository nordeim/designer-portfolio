import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, getProjectNeighbours, getPublishedProjects } from "@/lib/data";
import { ProjectHero, ProjectMeta } from "@/components/site/project-hero";
import { ProjectDetailBody } from "@/components/site/project-detail-body";
import { ErrorPanel } from "@/components/site/error-panel";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Metadata errors are NOT caught by error.tsx (Next bypasses the React
  // error boundary for generateMetadata) and would surface as a bare 500 —
  // degrade to generic metadata and let the page render decide the outcome
  // (styled error boundary on outage, 404 on unknown slug).
  let project;
  try {
    project = await getProjectBySlug(slug);
  } catch {
    return { title: "Project Detail" };
  }
  if (!project) return { title: "Project not found" };
  // Title matches the reference app's generic project-route title exactly
  // (title template composes "Project Detail | Designer Portfolio").
  // OG/description stay per-project: richer than the reference, invisible
  // in the browser UI, so visual parity is unaffected.
  return {
    title: "Project Detail",
    description: project.objective,
    openGraph: {
      title: `${project.title} — ${project.subtitle}`,
      description: project.objective,
      images: [{ url: project.heroImage }],
    },
  };
}

/**
 * Case-study page: full-bleed hero, meta grid, sticky intro column with the
 * zoomable gallery, and circular prev/next navigation — matching the
 * reference app's project route structure.
 *
 * Outage note: errors thrown from the dynamicParams fallback render path
 * bypass React error boundaries (Next serves a bare 500), so this page
 * guards its own data calls and renders the styled ErrorPanel directly.
 */
export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const errorPanel = (
    <ErrorPanel
      actions={
        <>
          <Link
            href={`/project/${slug}`}
            className="font-mono text-xs tracking-widest uppercase text-foreground hover:text-cobalt transition-colors border-b border-foreground/20 hover:border-cobalt pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="font-mono text-xs tracking-widest uppercase text-foreground hover:text-cobalt transition-colors border-b border-foreground/20 hover:border-cobalt pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            Back to home
          </Link>
        </>
      }
    />
  );

  // Guards are deliberately split: notFound() signals by THROWING a
  // framework sentinel, so it must stay outside the try/catch blocks.
  let project;
  try {
    project = await getProjectBySlug(slug);
  } catch {
    return errorPanel;
  }
  if (!project) notFound();

  let neighbours;
  try {
    neighbours = await getProjectNeighbours(slug);
  } catch {
    return errorPanel;
  }
  const { prev, next } = neighbours;

  const detail = {
    slug: project.slug,
    order: project.order,
    title: project.title,
    subtitle: project.subtitle,
    category: project.category,
    year: project.year,
    role: project.role,
    objective: project.objective,
    tagline: project.tagline,
    description: project.description,
    heroImage: project.heroImage,
    coverImage: project.coverImage,
    gallery: project.gallery,
  };

  const nav = (p: typeof prev) =>
    p ? { slug: p.slug, title: p.title, subtitle: p.subtitle, coverImage: p.coverImage } : null;

  return (
    <>
      <ProjectHero project={detail} />

      {/* Mobile: the meta grid sits between hero and detail body. */}
      <div className="md:hidden px-6">
        <ProjectMeta project={detail} />
      </div>

      <ProjectDetailBody project={detail} prev={nav(prev)} next={nav(next)} />
    </>
  );
}
