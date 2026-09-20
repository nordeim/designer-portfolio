import { describe, expect, it } from "vitest";
import {
  WHEEL_ITEM_SPREAD_DEG,
  clampRotation,
  itemAngle,
  itemPosition,
  wheelCenter,
  wheelRadius,
} from "@/lib/menu-wheel";

describe("menu wheel geometry (radial navigation overlay)", () => {
  it("computes the wheel center slightly above the viewport middle", () => {
    expect(wheelCenter(1440, 900)).toEqual({ x: 720, y: 430 });
    expect(wheelCenter(390, 844)).toEqual({ x: 195, y: 402 });
  });

  it("sizes the radius at 85% of the smaller viewport dimension", () => {
    expect(wheelRadius(1440, 900)).toBeCloseTo(765, 5);
    expect(wheelRadius(390, 844)).toBeCloseTo(331.5, 5);
  });

  it("spreads items symmetrically around the 3 o'clock axis", () => {
    // 4 items → angles -33°, -11°, +11°, +33°
    const angles = [0, 1, 2, 3].map((i) => itemAngle(i, 4));
    expect((angles[0] * 180) / Math.PI).toBeCloseTo(-33, 5);
    expect((angles[1] * 180) / Math.PI).toBeCloseTo(-11, 5);
    expect((angles[2] * 180) / Math.PI).toBeCloseTo(11, 5);
    expect((angles[3] * 180) / Math.PI).toBeCloseTo(33, 5);
    expect(WHEEL_ITEM_SPREAD_DEG).toBe(22);
  });

  it("places first/last items symmetrically above and below the center", () => {
    const { x: cx, y: cy } = wheelCenter(1440, 900);
    const r = wheelRadius(1440, 900);
    const first = itemPosition(0, 4, cx, cy, r);
    const last = itemPosition(3, 4, cx, cy, r);
    // Mirror symmetry across the horizontal axis through the center.
    expect(first.y + last.y).toBeCloseTo(2 * cy, 4);
    expect(first.x).toBeCloseTo(last.x, 4);
  });

  it("keeps an item near the 3 o'clock axis at the wheel edge", () => {
    const { x: cx, y: cy } = wheelCenter(1440, 900);
    const r = wheelRadius(1440, 900);
    // item index 1.5 would sit exactly on the axis; check item 2 is close.
    const pos = itemPosition(2, 4, cx, cy, r);
    expect(pos.y).toBeGreaterThan(cy - r * 0.4);
    expect(pos.y).toBeLessThan(cy + r * 0.4);
    expect(pos.x).toBeGreaterThan(cx);
  });

  it("clamps rotation to the arc bounds with overshoot headroom", () => {
    // The reference clamps asymmetrically: Math.max(-(C+E), Math.min(C, r)) —
    // upper bound is the arc itself, lower bound gets the overshoot headroom.
    // 4 items, radius 765 → C = 33, E = 100/765 * (180/π) ≈ 7.49
    const upper = clampRotation(999, 4, 765);
    const lower = clampRotation(-999, 4, 765);
    expect(upper).toBe(33);
    expect(lower).toBeCloseTo(-(33 + (100 / 765) * (180 / Math.PI)), 5);
    expect(clampRotation(0, 4, 765)).toBe(0);
    // Values inside the range pass through unchanged.
    expect(clampRotation(12.5, 4, 765)).toBe(12.5);
  });
});
