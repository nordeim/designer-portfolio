import { describe, expect, it } from "vitest";
import { buildConstellation, MOBILE_SCALE, dotFloatPattern } from "@/lib/constellation";

const projects = [
  { cover: "/c0.jpg", first: "/g0.jpg" },
  { cover: "/c1.jpg", first: "/g1.jpg" },
  { cover: "/c2.jpg", first: "/g2.jpg" },
  { cover: "/c3.jpg", first: "/g3.jpg" },
  { cover: "/c4.jpg", first: "/g4.jpg" },
];

const extras = { slot4: "/extra-frame.jpg", slot6: "/extra-gemini.jpg" };

describe("hero constellation layout", () => {
  it("produces exactly 10 desktop items", () => {
    const items = buildConstellation(projects, extras, false);
    expect(items).toHaveLength(10);
  });

  it("uses project covers for the first five slots and first images for the rest", () => {
    const items = buildConstellation(projects, extras, false);
    expect(items.slice(0, 4).map((i) => i.src)).toEqual(["/c0.jpg", "/c1.jpg", "/c2.jpg", "/c3.jpg"]);
    expect(items[5].src).toBe("/g0.jpg");
    expect(items[7].src).toBe("/g2.jpg");
    expect(items[8].src).toBe("/g3.jpg");
    expect(items[9].src).toBe("/g4.jpg");
  });

  it("overrides slots 4 and 6 with the extra images and contain fitting", () => {
    const items = buildConstellation(projects, extras, false);
    expect(items[4].src).toBe("/extra-frame.jpg");
    expect(items[4].contain).toBe(true);
    expect(items[6].src).toBe("/extra-gemini.jpg");
    expect(items[6].contain).toBe(true);
    expect(items[0].contain).toBe(false);
  });

  it("sizes slots 4 and 6 with the reference's special dimensions", () => {
    const items = buildConstellation(projects, extras, false);
    expect(items[4]).toMatchObject({ width: 273, height: 273 });
    expect(items[6]).toMatchObject({ width: 363, height: 654 });
  });

  it("keeps every position inside the viewport bounds", () => {
    for (const mobile of [false, true]) {
      const items = buildConstellation(projects, extras, mobile);
      for (const item of items) {
        expect(item.x).toBeGreaterThan(0);
        expect(item.x).toBeLessThan(100);
        expect(item.y).toBeGreaterThan(0);
        expect(item.y).toBeLessThan(100);
        expect(item.width).toBeGreaterThan(0);
        expect(item.height).toBeGreaterThan(0);
      }
    }
  });

  it("scales mobile geometry down from desktop", () => {
    const desktop = buildConstellation(projects, extras, false);
    const mobile = buildConstellation(projects, extras, true);
    // Same image order; smaller sizes (0.6 factor) and different spots.
    expect(mobile).toHaveLength(8);
    expect(mobile.map((i) => i.src)).toEqual(desktop.map((i) => i.src).slice(0, 8));
    expect(mobile[0].width).toBeCloseTo(Math.round(145 * MOBILE_SCALE), 0);
    expect(mobile[4].contain).toBe(true); // contain flags follow the source slots
    expect(mobile[6].contain).toBe(true);
  });

  it("maps a float animation pattern deterministically per item id", () => {
    expect(dotFloatPattern(0)).toBe("deep");
    expect(dotFloatPattern(1)).toBe("mid");
    expect(dotFloatPattern(2)).toBe("shallow");
    expect(dotFloatPattern(3)).toBe("deep");
    expect(dotFloatPattern(9)).toBe("deep"); // 9 % 3 === 0
    expect(dotFloatPattern(11)).toBe("shallow");
  });

  it("falls back to the first cover when fewer than five sources are given", () => {
    // 10 desktop spots but only one source: slots beyond the natural list
    // reuse the first project's cover instead of crashing.
    const items = buildConstellation([{ cover: "/c1.jpg", first: "/f1.jpg" }], extras, false);
    expect(items).toHaveLength(10);
    expect(items[2].src).toBe("/c1.jpg");
    expect(items[7].src).toBe("/c1.jpg");
    expect(items[9].src).toBe("/c1.jpg");
    expect(items[4].src).toBe(extras.slot4);
    expect(items[6].src).toBe(extras.slot6);
  });

  it("degrades to an empty src when no sources exist", () => {
    // Defensive branch: an empty catalog still renders all spots.
    const items = buildConstellation([], extras, false);
    expect(items).toHaveLength(10);
    expect(items[0].src).toBe("");
    expect(items[4].src).toBe(extras.slot4);
    expect(items[6].src).toBe(extras.slot6);
  });
});
