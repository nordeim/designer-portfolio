import { describe, expect, it } from "vitest";
import { MARQUEE_ITEMS, SKILL_GROUPS, SOCIAL_LINKS } from "@/lib/site-config";

/**
 * Source-app DOM-parity contracts (session 14).
 *
 * The reference app stores display copy in the DOM and applies visual
 * transformations via CSS; this clone must do the same so the DOM text
 * (screen readers, text extraction, copy-paste) matches the reference:
 *   - skill-group titles are TITLE-case in the DOM (CSS uppercases them)
 *   - the marquee band, however, is UPPERCASE in the source DOM as-is
 *   - the contact page's Social column lists all four networks (including
 *     X / Twitter) with the "↗" arrow suffix
 */

describe("SKILL_GROUPS DOM parity", () => {
  it("every group title is title-case in the DOM (visual uppercasing is CSS)", () => {
    for (const group of SKILL_GROUPS) {
      // Title-case = starts uppercase AND contains at least one lowercase
      // letter (guards against regressing to hardcoded all-caps strings).
      expect(group.title).toMatch(/^[A-Z].*[a-z]/);
    }
  });

  it("keeps the four reference groups in order", () => {
    expect(SKILL_GROUPS.map((g) => g.title)).toEqual([
      "Brand Identity",
      "Print & Packaging",
      "Digital Branding",
      "Tools",
    ]);
  });
});

describe("SOCIAL_LINKS DOM parity", () => {
  it("lists all four networks including X / Twitter", () => {
    expect(SOCIAL_LINKS.map((l) => l.label)).toEqual([
      "Dribbble",
      "LinkedIn",
      "Instagram",
      "X / Twitter",
    ]);
  });
});

describe("MARQUEE_ITEMS DOM parity", () => {
  it("stays uppercase in the DOM, matching the source", () => {
    for (const item of MARQUEE_ITEMS) {
      expect(item).toBe(item.toUpperCase());
    }
  });
});
