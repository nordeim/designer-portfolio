import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, getProjectNeighbours, getPublishedProjects } from "@/lib/data";
import { ProjectHero, ProjectMeta } from "@/components/site/project-hero";
import { ProjectDetailBody } from "@/components/site/project-detail-body";

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
 */
export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = await getProjectNeighbours(slug);

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
