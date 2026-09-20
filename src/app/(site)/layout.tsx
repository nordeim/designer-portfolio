import { getPublishedProjects } from "@/lib/data";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

/**
 * Layout for all public pages: fetches the published project list for the
 * menu overlay (with cover images for the wheel's circular hover preview)
 * and renders the shared header/footer chrome. The wrapper carries the
 * sage-tinted 6-column `ghost-grid` background, matching the reference
 * app's page-wide grid.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const projects = await getPublishedProjects();
  const menuProjects = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    order: p.order,
    title: p.title,
    coverImage: p.coverImage,
  }));

  return (
    <div className="ghost-grid min-h-screen flex flex-col bg-background">
      <SiteHeader projects={menuProjects} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
