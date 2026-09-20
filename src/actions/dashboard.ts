"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  inquiryStatusSchema,
  projectInputSchema,
  serializeGallery,
  serializeStringList,
  success,
  failure,
  zodFieldErrors,
  type ActionResult,
  type InquiryInput,
  type ProjectInput,
} from "@/lib/validation";

/**
 * Dashboard mutations. Every action authorizes via the DB session before
 * touching data, validates input with Zod, and returns ActionResult
 * envelopes — nothing throws across the action boundary.
 */

const UNAVAILABLE = "The dashboard is temporarily unavailable. Please try again in a moment.";

/**
 * Never throw across the action boundary: an infrastructure failure (e.g. a
 * database outage) degrades to a generic envelope; the error is logged
 * server-side so the cause stays diagnosable without leaking to the client.
 */
async function guarded<T>(body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    console.error("[dashboard-action]", error);
    return failure(UNAVAILABLE);
  }
}

async function requireOwner(): Promise<ActionResult<never> | null> {
  const user = await getCurrentUser();
  if (!user) return failure("You must be signed in.");
  if (user.role !== "OWNER") return failure("You do not have permission to modify content.");
  return null;
}

function revalidateProjectPages(slug?: string): void {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  if (slug) revalidatePath(`/project/${slug}`);
}

// ---------------------------------------------------------------------------
// Projects CRUD
// ---------------------------------------------------------------------------

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return guarded(async () => {
    const denied = await requireOwner();
    if (denied) return denied;

    const parsed = projectInputSchema.safeParse(input);
    if (!parsed.success) {
      return failure("Please check the form for errors.", zodFieldErrors(parsed.error));
    }

    const slug = parsed.data.slug;
    const existing = await db.project.findUnique({ where: { slug } });
    if (existing) {
      return failure("That slug is already in use.", { slug: "A project with this slug already exists." });
    }

    const project = await db.project.create({
      data: {
        ...parsed.data,
        processImage: parsed.data.processImage || null,
        outcomes: serializeStringList(parsed.data.outcomes),
        deliverables: serializeStringList(parsed.data.deliverables),
        gallery: serializeGallery(parsed.data.gallery),
      },
    });

    revalidateProjectPages(project.slug);
    return success({ id: project.id, slug: project.slug });
  });
}

export async function updateProjectAction(
  id: string,
  input: ProjectInput,
): Promise<ActionResult<{ slug: string }>> {
  return guarded(async () => {
    const denied = await requireOwner();
    if (denied) return denied;

    const parsed = projectInputSchema.safeParse(input);
    if (!parsed.success) {
      return failure("Please check the form for errors.", zodFieldErrors(parsed.error));
    }

    const existing = await db.project.findFirst({ where: { id } });
    if (!existing) return failure("Project not found.");

    const slugClash = await db.project.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });
    if (slugClash) {
      return failure("That slug is already in use.", { slug: "A project with this slug already exists." });
    }

    await db.project.update({
      where: { id },
      data: {
        ...parsed.data,
        processImage: parsed.data.processImage || null,
        outcomes: serializeStringList(parsed.data.outcomes),
        deliverables: serializeStringList(parsed.data.deliverables),
        gallery: serializeGallery(parsed.data.gallery),
      },
    });

    revalidateProjectPages(parsed.data.slug);
    if (existing.slug !== parsed.data.slug) revalidatePath(`/project/${existing.slug}`);
    return success({ slug: parsed.data.slug });
  });
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const denied = await requireOwner();
    if (denied) return denied;

    const existing = await db.project.findFirst({ where: { id } });
    if (!existing) return failure("Project not found.");

    await db.project.delete({ where: { id } });
    revalidateProjectPages(existing.slug);
    return success(undefined);
  });
}

export async function toggleProjectPublishedAction(id: string): Promise<ActionResult<{ published: boolean }>> {
  return guarded(async () => {
    const denied = await requireOwner();
    if (denied) return denied;

    const project = await db.project.findFirst({ where: { id } });
    if (!project) return failure("Project not found.");

    const updated = await db.project.update({
      where: { id },
      data: { published: !project.published },
    });

    revalidateProjectPages(project.slug);
    return success({ published: updated.published });
  });
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

export async function updateInquiryStatusAction(
  id: string,
  status: string,
): Promise<ActionResult<{ status: string }>> {
  return guarded(async () => {
    const denied = await requireOwner();
    if (denied) return denied;

    const parsed = inquiryStatusSchema.safeParse(status);
    if (!parsed.success) return failure("Unknown status.");

    const inquiry = await db.inquiry.findFirst({ where: { id } });
    if (!inquiry) return failure("Inquiry not found.");

    await db.inquiry.update({ where: { id }, data: { status: parsed.data } });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inquiries");
    return success({ status: parsed.data });
  });
}

export async function deleteInquiryAction(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const denied = await requireOwner();
    if (denied) return denied;

    const inquiry = await db.inquiry.findFirst({ where: { id } });
    if (!inquiry) return failure("Inquiry not found.");

    await db.inquiry.delete({ where: { id } });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inquiries");
    return success(undefined);
  });
}
