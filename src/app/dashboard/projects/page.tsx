import type { Metadata } from "next";
import { getAllProjects } from "@/lib/data";
import { ProjectsManager } from "@/components/dashboard/projects-manager";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardProjectsPage() {
  const projects = await getAllProjects();
  return <ProjectsManager projects={projects} />;
}
