import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { getPublishedProjects } from "@/lib/data";
import { ProjectIndex } from "@/components/site/project-index";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Selected works — brand identity, print & merchandise, packaging, and web projects by Alex Moreau.",
  path: "/projects",
});

/**
 * The project archive: label + display heading over the interactive index
 * rows. Structure matches the reference app's /projects route.
 */
export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  const rows = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    order: p.order,
    title: p.title,
    category: p.category,
    year: p.year,
    image: p.coverImage,
  }));

  return (
    <div>
      <section className="px-6 md:px-8 pt-32 pb-12" aria-label="Selected Works">
        <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">Selected Works</span>
        <h1 className="font-body text-4xl md:text-6xl font-light tracking-tight text-foreground mt-3">Projects</h1>
      </section>
      <ProjectIndex projects={rows} />
    </div>
  );
}
