import { z } from "zod";

/**
 * Zod schemas guarding every boundary of the application. Server actions and
 * API routes parse untrusted input through these before it reaches the
 * database; the shared types below are the single source of truth for the
 * domain models that cross the network.
 */

// ---------------------------------------------------------------------------
// Gallery media (stored as a JSON string column in SQLite)
// ---------------------------------------------------------------------------

export const mediaItemSchema = z.object({
  kind: z.enum(["image", "video"]),
  src: z.string().min(1),
  alt: z.string().min(1),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;

const stringListSchema = z.array(z.string().min(1));

/** Parse a JSON string column into a validated MediaItem list. */
export function parseGallery(json: string): MediaItem[] {
  try {
    return mediaItemSchema.array().parse(JSON.parse(json));
  } catch {
    // Corrupt data degrades to an empty gallery instead of crashing the page.
    return [];
  }
}

/** Parse a JSON string column into a validated plain string list. */
export function parseStringList(json: string): string[] {
  try {
    return stringListSchema.parse(JSON.parse(json));
  } catch {
    return [];
  }
}

export function serializeGallery(items: MediaItem[]): string {
  return JSON.stringify(mediaItemSchema.array().parse(items));
}

export function serializeStringList(items: string[]): string {
  return JSON.stringify(stringListSchema.parse(items));
}

// ---------------------------------------------------------------------------
// Contact inquiry
// ---------------------------------------------------------------------------

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(254),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  projectType: z.enum([
    "Brand Identity",
    "Digital Product",
    "Spatial Design",
    "Motion Design",
    "Typography",
    "Other",
  ]),
  budgetRange: z.enum(["$10K – $25K", "$25K – $50K", "$50K – $100K", "$100K+"]),
  timeline: z.enum(["1 – 2 months", "3 – 6 months", "6+ months", "Flexible"]),
  details: z.string().trim().min(20, "Please tell me a little more about your project (min. 20 characters)").max(5000),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const inquiryStatusSchema = z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

// ---------------------------------------------------------------------------
// Project CRUD (dashboard)
// ---------------------------------------------------------------------------

export const projectInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens"),
  order: z.number().int().min(0).max(999),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(120),
  year: z.string().trim().regex(/^\d{4}$/, "Year must be a 4-digit number"),
  category: z.string().trim().min(1).max(80),
  objective: z.string().trim().min(1).max(2000),
  tagline: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  problem: z.string().trim().min(1).max(5000),
  solution: z.string().trim().min(1).max(5000),
  process: z.string().trim().min(1).max(5000),
  outcomes: z.array(z.string().trim().min(1).max(300)).max(20),
  deliverables: z.array(z.string().trim().min(1).max(300)).max(20),
  gallery: z.array(mediaItemSchema).max(20),
  heroImage: z.string().trim().min(1),
  coverImage: z.string().trim().min(1),
  processImage: z.string().trim().min(1).optional().or(z.literal("")),
  featured: z.boolean(),
  published: z.boolean(),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Shared action envelope (never throw across the action boundary)
// ---------------------------------------------------------------------------

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function success<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function failure(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Flatten a ZodError into a `field -> message` map for form rendering. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
