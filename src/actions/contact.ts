"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { inquirySchema, success, failure, zodFieldErrors, type ActionResult, type InquiryInput } from "@/lib/validation";

/**
 * Public inquiry submission. Input is Zod-validated, honeypot-checked, and
 * rate-limited before it reaches the database. The dashboard lists revalidate
 * so a signed-in owner sees new inquiries without a manual refresh.
 */

export interface SubmitInquiryPayload extends InquiryInput {
  /** Honeypot — bots that fill the hidden "website" field are dropped. */
  website?: string;
}

// In-memory sliding window keyed by client identity (best-effort, single
// instance; swap for a shared store when horizontally scaled).
const submissions = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;

function throttle(key: string): boolean {
  const now = Date.now();
  const hits = (submissions.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  submissions.set(key, hits);
  return hits.length > MAX_PER_HOUR;
}

export async function submitInquiryAction(
  input: SubmitInquiryPayload,
): Promise<ActionResult<{ id: string }>> {
  // Honeypot: real users never see the "website" field.
  if (input.website && input.website.trim().length > 0) {
    return failure("Submission rejected.");
  }

  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please check the form for errors.", zodFieldErrors(parsed.error));
  }

  const { name, email, company, projectType, budgetRange, timeline, details } = parsed.data;
  const key = email.toLowerCase();
  if (throttle(key)) {
    return failure("You've sent several inquiries recently. Please try again later.");
  }

  const inquiry = await db.inquiry.create({
    data: {
      name,
      email: key,
      company: company || null,
      projectType,
      budgetRange,
      timeline,
      details,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inquiries");

  return success({ id: inquiry.id });
}
