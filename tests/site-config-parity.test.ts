import { describe, expect, it } from "vitest";
import { LOGO_BREATH, MARQUEE_ITEMS, SKILL_GROUPS, SOCIAL_LINKS, SITE } from "@/lib/site-config";

/**
 * Source-app DOM-parity contracts (session 14, refreshed session 30).
 *
 * The reference app stores display copy in the DOM and applies visual
 * transformations via CSS; this clone must do the same so the DOM text
 * (screen readers, text extraction, copy-paste) matches the reference:
 *   - skill-group titles are TITLE-case in the DOM (CSS uppercases them)
 *   - the marquee band is ALSO title-case in the source DOM (session 30
 *     re-probe: "Brand Identity" + text-transform: uppercase — the
 *     session-14 "uppercase as-is" contract was a mis-read of visually
 *     uppercased text)
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

describe("SITE hero-meta DOM parity (session 26)", () => {
  it("role is mixed-case in the DOM (CSS uppercases it visually)", () => {
    // Source DOM textContent: "Graphic Designer" — the hero's `uppercase`
    // class renders it. An uppercase literal would double-transform and
    // diverge in screen readers / text extraction.
    expect(SITE.role).toBe("Graphic Designer");
  });

  it("basedIn matches the source's exact DOM casing", () => {
    // Source DOM textContent: "BASED: Berlin" (prefix caps, city mixed).
    expect(SITE.basedIn).toBe("BASED: Berlin");
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
  it("is title-case in the DOM, matching the source (session 30 re-probe)", () => {
    // Source DOM textContent: "Brand Identity", "Digital Product", … — the
    // band's `uppercase` class renders them visually. Session 14 pinned
    // "uppercase as-is", but the session-30 double-verified probe (computed
    // styles + text-node extraction) shows mixed-case storage + CSS
    // transform — the same pattern as SKILL_GROUPS and the hero meta line.
    for (const item of MARQUEE_ITEMS) {
      expect(item).toMatch(/^[A-Z].*[a-z]/);
    }
  });

  it("keeps the six reference items in order", () => {
    expect(MARQUEE_ITEMS).toEqual([
      "Brand Identity",
      "Digital Product",
      "Motion Design",
      "Spatial Design",
      "Typography",
      "Art Direction",
    ]);
  });
});

describe("LOGO_BREATH cadence parity (session 30)", () => {
  it("holds the expanded state for the source's 3.4s, not a blink", () => {
    // Source ground truth (20 s @100 ms letter-spacing probe): tight 3.3 s
    // → expand 0.4 s → EXPANDED HOLD 3.4 s → collapse 0.35 s (cycle ≈ 7.4 s).
    // The pre-fix machine held the expanded phase for only 0.5 s total —
    // the logo barely reached 0.7em before collapsing.
    const expandedHold = LOGO_BREATH.spacingMs - 400; // minus the 0.4s expand transition
    expect(expandedHold).toBeGreaterThanOrEqual(3400);
  });

  it("keeps the tight state for the source's ≈3.4s across reset + restart", () => {
    const tightHold = LOGO_BREATH.resetMs - 350 + LOGO_BREATH.restartMs + LOGO_BREATH.idleMs;
    // 0.35s collapse + tight hold; idle is the pre-expand tight phase.
    expect(tightHold).toBeGreaterThanOrEqual(3300);
  });
});
