import { db } from "@/lib/db";
import { parseGallery, parseStringList, type MediaItem } from "@/lib/validation";

/**
 * Read-side data access. All queries used by public pages live here so the
 * RSC layer stays thin and the query surface is auditable in one place.
 */

export interface ProjectView {
  id: string;
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  role: string;
  year: string;
  category: string;
  objective: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  process: string;
  outcomes: string[];
  deliverables: string[];
  gallery: MediaItem[];
  heroImage: string;
  coverImage: string;
  processImage: string | null;
  featured: boolean;
  published: boolean;
}

type ProjectRow = Awaited<ReturnType<typeof db.project.findFirstOrThrow>>;

function toView(row: ProjectRow): ProjectView {
  return {
    id: row.id,
    slug: row.slug,
    order: row.order,
    title: row.title,
    subtitle: row.subtitle,
    role: row.role,
    year: row.year,
    category: row.category,
    objective: row.objective,
    tagline: row.tagline,
    description: row.description,
    problem: row.problem,
    solution: row.solution,
    process: row.process,
    outcomes: parseStringList(row.outcomes),
    deliverables: parseStringList(row.deliverables),
    gallery: parseGallery(row.gallery),
    heroImage: row.heroImage,
    coverImage: row.coverImage,
    processImage: row.processImage || null,
    featured: row.featured,
    published: row.published,
  };
}

/** Projects for the landing page ("Selected Works") — featured, published. */
export async function getFeaturedProjects(limit = 3): Promise<ProjectView[]> {
  const rows = await db.project.findMany({
    where: { published: true, featured: true },
    orderBy: [{ order: "asc" }],
    take: limit,
  });
  return rows.map(toView);
}

/** Every published project, in display order. */
export async function getPublishedProjects(): Promise<ProjectView[]> {
  const rows = await db.project.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }],
  });
  return rows.map(toView);
}

/** All projects including drafts — dashboard only. */
export async function getAllProjects(): Promise<ProjectView[]> {
  const rows = await db.project.findMany({ orderBy: [{ order: "asc" }] });
  return rows.map(toView);
}

export async function getProjectBySlug(slug: string): Promise<ProjectView | null> {
  const row = await db.project.findFirst({ where: { slug } });
  if (!row || !row.published) return null;
  return toView(row);
}

export async function getProjectById(id: string): Promise<ProjectView | null> {
  const row = await db.project.findFirst({ where: { id } });
  return row ? toView(row) : null;
}

/** Prev/next navigation on a project detail page (wraps around). */
export async function getProjectNeighbours(slug: string): Promise<{ prev: ProjectView | null; next: ProjectView | null }> {
  const all = await getPublishedProjects();
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  const prev = all[(idx - 1 + all.length) % all.length] ?? null;
  const next = all[(idx + 1) % all.length] ?? null;
  return { prev, next };
}

export interface InquirySummary {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectType: string;
  budgetRange: string;
  timeline: string;
  details: string;
  status: string;
  createdAt: Date;
}

export async function getInquiries(status?: string): Promise<InquirySummary[]> {
  return db.inquiry.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export interface DashboardStats {
  totalProjects: number;
  publishedProjects: number;
  totalInquiries: number;
  newInquiries: number;
  latestInquiryAt: Date | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalProjects, publishedProjects, totalInquiries, newInquiries, latest] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { published: true } }),
    db.inquiry.count(),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.inquiry.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  return {
    totalProjects,
    publishedProjects,
    totalInquiries,
    newInquiries,
    latestInquiryAt: latest?.createdAt ?? null,
  };
}
