import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/data";
import { ProjectIndex } from "@/components/site/project-index";
import { MarqueeBand } from "@/components/site/marquee-band";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected works — brand identity, print & merchandise, packaging, and web projects by Alex Moreau.",
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <>
      <section className="mx-auto max-w-[1400px] px-6 md:px-10 pt-28 md:pt-40 pb-8 md:pb-12" aria-label="Selected Works">
        <h1 className="label-mono text-muted-foreground mb-6">SELECTED WORKS</h1>
        <h2 className="font-body text-3xl md:text-5xl font-light tracking-tight text-foreground mb-10 md:mb-16">
          Projects
        </h2>
        <ProjectIndex projects={projects} />
      </section>
      <div className="mt-16 md:mt-24">
        <MarqueeBand />
      </div>
    </>
  );
}
