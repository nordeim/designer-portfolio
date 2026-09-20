import { getPublishedProjects } from "@/lib/data";
import { SITE } from "@/lib/site-config";
import { HeroConstellation } from "@/components/site/hero-constellation";
import { WorksSection } from "@/components/site/works-section";
import { PhilosophySection } from "@/components/site/philosophy-section";
import type { ConstellationSource } from "@/lib/constellation";

/**
 * Landing page: the full-screen Introduction (image constellation + name +
 * typewriter meta), the Selected Works editorial rows, and the Design
 * Philosophy statement. Server-rendered; interactive pieces are client
 * islands. Structure mirrors the reference app's home route.
 */
export default async function HomePage() {
  const projects = await getPublishedProjects();

  // The reference shows the first three projects (its own slice(0, 3)).
  const works = projects.slice(0, 3).map((p) => ({
    slug: p.slug,
    order: p.order,
    title: p.title,
    subtitle: p.subtitle,
    category: p.category,
    year: p.year,
    heroImage: p.heroImage,
  }));

  // Constellation sources: each project's cover plus its first image.
  const sources: ConstellationSource[] = projects.map((p) => ({
    cover: p.coverImage,
    first: p.gallery.find((m) => m.kind === "image")?.src ?? p.coverImage,
  }));

  return (
    <>
      <HeroConstellation
        sources={sources}
        extras={{
          slot4: "/constellation/extra-frame.jpg",
          slot6: "/constellation/extra-gemini.jpg",
        }}
        meta={[SITE.role, SITE.basedIn, SITE.email]}
      />
      <WorksSection projects={works} />
      <PhilosophySection philosophy={SITE.philosophy} />
    </>
  );
}
