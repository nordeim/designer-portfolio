import { describe, expect, it } from "vitest";
import {
  inquirySchema,
  loginSchema,
  mediaItemSchema,
  parseGallery,
  parseStringList,
  projectInputSchema,
  zodFieldErrors,
} from "@/lib/validation";

const validInquiry = {
  name: "Jane Client",
  email: "jane@example.com",
  company: "Acme",
  projectType: "Brand Identity",
  budgetRange: "$10K – $25K",
  timeline: "1 – 2 months",
  details: "We need a full rebrand for our coffee subscription startup.",
};

describe("inquirySchema", () => {
  it("accepts a complete, valid inquiry", () => {
    const result = inquirySchema.safeParse(validInquiry);
    expect(result.success).toBe(true);
  });

  it("accepts an inquiry without a company", () => {
    const { company, ...rest } = validInquiry;
    const result = inquirySchema.safeParse({ ...rest, company: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = inquirySchema.safeParse({ ...validInquiry, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toHaveProperty("email");
  });

  it("rejects a too-short name", () => {
    const result = inquirySchema.safeParse({ ...validInquiry, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown project type", () => {
    const result = inquirySchema.safeParse({ ...validInquiry, projectType: "Nonsense" });
    expect(result.success).toBe(false);
  });

  it("rejects details under the minimum length", () => {
    const result = inquirySchema.safeParse({ ...validInquiry, details: "too short" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "owner@example.com", password: "longenough1" });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({ email: "owner@example.com", password: "short" });
    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toHaveProperty("password");
  });
});

describe("mediaItemSchema + JSON column parsing", () => {
  it("round-trips a gallery", () => {
    const items = [
      { kind: "image" as const, src: "/projects/x/hero.jpg", alt: "Hero" },
      { kind: "video" as const, src: "/projects/x/clip.mp4", alt: "Clip" },
    ];
    const json = JSON.stringify(items);
    expect(parseGallery(json)).toEqual(items);
  });

  it("degrades corrupt gallery JSON to an empty list", () => {
    expect(parseGallery("{not json")).toEqual([]);
    expect(parseGallery(JSON.stringify([{ kind: "audio", src: "x", alt: "y" }]))).toEqual([]);
  });

  it("degrades corrupt string-list JSON to an empty list", () => {
    expect(parseStringList("[1,2,3]")).toEqual([]);
    expect(parseStringList("null")).toEqual([]);
  });

  it("accepts only non-empty strings in string lists", () => {
    expect(parseStringList(JSON.stringify(["a", "", "b"]))).toEqual([]);
  });
});

describe("projectInputSchema", () => {
  const base = {
    slug: "kinto-cafe-branding",
    order: 1,
    title: "Kinto",
    subtitle: "Matcha Brand Identity",
    role: "Brand Designer",
    year: "2035",
    category: "Branding",
    objective: "Full brand identity for a matcha brand.",
    tagline: "Matcha, elevated",
    description: "A premium matcha brand rooted in Japanese tea culture.",
    problem: "No visual personality.",
    solution: "Japanese grid principles and muted earthy tones.",
    process: "Two-week immersion, then identity work.",
    outcomes: ["Recall up 3x"],
    deliverables: ["Logo", "Packaging"],
    gallery: [{ kind: "image" as const, src: "/p/hero.jpg", alt: "Hero" }],
    heroImage: "/p/hero.jpg",
    coverImage: "/p/cover.jpg",
    processImage: "/p/process.jpg",
    featured: true,
    published: true,
  };

  it("accepts a complete project", () => {
    expect(projectInputSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a slug with uppercase or spaces", () => {
    expect(projectInputSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false);
    expect(projectInputSchema.safeParse({ ...base, slug: "BadSlug" }).success).toBe(false);
  });

  it("rejects a non-4-digit year", () => {
    expect(projectInputSchema.safeParse({ ...base, year: "35" }).success).toBe(false);
  });

  it("rejects a missing hero image", () => {
    expect(projectInputSchema.safeParse({ ...base, heroImage: "" }).success).toBe(false);
  });

  it("allows an empty process image", () => {
    expect(projectInputSchema.safeParse({ ...base, processImage: "" }).success).toBe(true);
  });
});
