/**
 * Layout data for the landing hero's image "constellation" — the floating
 * project previews scattered over the hero on a 12-column (desktop) or
 * 6-column (mobile) grid, each anchored by an animated cobalt dot.
 * Positions and sizes mirror the reference app's table; the math is pure so
 * it stays unit-testable.
 */

export interface ConstellationSource {
  cover: string;
  first: string;
}

export interface ConstellationItem {
  id: number;
  /** Horizontal position as a percentage of the hero width. */
  x: number;
  /** Vertical position as a percentage of the hero height. */
  y: number;
  width: number;
  height: number;
  src: string;
  contain: boolean;
}

/** Reference size presets (px), indexed by slot % 8. */
const SIZE_PRESETS: ReadonlyArray<{ w: number; h: number }> = [
  { w: 145, h: 194 },
  { w: 218, h: 290 },
  { w: 290, h: 363 },
  { w: 242, h: 169 },
  { w: 182, h: 182 },
  { w: 315, h: 218 },
  { w: 121, h: 218 },
  { w: 266, h: 315 },
];

/** Desktop spots: column (1–11 of 12) + vertical percentage. */
const DESKTOP_SPOTS: ReadonlyArray<{ col: number; y: number }> = [
  { col: 1, y: 22 },
  { col: 2, y: 68 },
  { col: 4, y: 40 },
  { col: 5, y: 75 },
  { col: 6, y: 18 },
  { col: 7, y: 55 },
  { col: 9, y: 30 },
  { col: 10, y: 72 },
  { col: 11, y: 45 },
  { col: 3, y: 55 },
];

/** Mobile spots: column (1–5 of 6) + vertical percentage. */
const MOBILE_SPOTS: ReadonlyArray<{ col: number; y: number }> = [
  { col: 1, y: 8 },
  { col: 5, y: 20 },
  { col: 2, y: 35 },
  { col: 5, y: 48 },
  { col: 3, y: 62 },
  { col: 4, y: 74 },
  { col: 2, y: 88 },
  { col: 4, y: 95 },
];

export const MOBILE_SCALE = 0.6;

/** The reference enlarges slots 4 and 6 and swaps in two specific images. */
const SPECIAL_SIZES: Record<number, { w: number; h: number }> = {
  4: { w: 273, h: 273 }, // 182 × 1.5
  6: { w: 363, h: 654 },
};

export interface ConstellationExtras {
  slot4: string;
  slot6: string;
}

/**
 * Build the constellation item list. `sources` supplies each project's
 * cover and first (non-video) gallery image; slots 4 and 6 are overridden
 * with `extras` per the reference. Mobile uses 8 spots at 0.6 scale.
 */
export function buildConstellation(
  sources: readonly ConstellationSource[],
  extras: ConstellationExtras,
  mobile: boolean,
): ConstellationItem[] {
  const n = [
    ...sources.map((s) => s.cover),
    ...sources.map((s) => s.first),
  ];
  n[4] = extras.slot4;
  n[6] = extras.slot6;

  const spots = mobile ? MOBILE_SPOTS : DESKTOP_SPOTS;
  const columns = mobile ? 6 : 12;

  return spots.map((spot, i) => {
    const preset = SPECIAL_SIZES[i] ?? SIZE_PRESETS[i % SIZE_PRESETS.length];
    const scale = mobile && !SPECIAL_SIZES[i] ? MOBILE_SCALE : 1;
    return {
      id: i,
      x: (spot.col / columns) * 100,
      y: spot.y,
      width: Math.round(preset.w * scale),
      height: Math.round(preset.h * scale),
      src: n[i] ?? sources[0]?.cover ?? "",
      contain: i === 4 || i === 6,
    };
  });
}

/**
 * The float animation pattern for an item's cobalt dot, derived the same
 * way the reference does (id % 3): 0 = deep double bounce, 1 = mid, 2 = shallow.
 */
export function dotFloatPattern(id: number): "deep" | "mid" | "shallow" {
  switch (id % 3) {
    case 0:
      return "deep";
    case 1:
      return "mid";
    default:
      return "shallow";
  }
}
