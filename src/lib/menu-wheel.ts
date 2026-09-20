/**
 * Pure geometry helpers for the radial menu overlay (the wheel navigation).
 *
 * The reference app arranges its menu items on a circle whose radius is 85%
 * of the smaller viewport dimension, centered horizontally and 20px above the
 * vertical middle. Items sit 22° apart around the 3 o'clock axis, the wheel
 * rotates with the scroll wheel, and labels counter-rotate so they stay
 * upright. Extracted as pure functions so the math is unit-testable.
 */

export const WHEEL_ITEM_SPREAD_DEG = 22;

export interface Point {
  x: number;
  y: number;
}

/** Center of the wheel: horizontal middle, 20px above the vertical middle. */
export function wheelCenter(viewportW: number, viewportH: number): Point {
  return { x: viewportW / 2, y: viewportH / 2 - 20 };
}

/** Wheel radius: 85% of the smaller viewport dimension. */
export function wheelRadius(viewportW: number, viewportH: number): number {
  return Math.min(viewportW, viewportH) * 0.85;
}

/** Angle (radians) of item `index` of `count`, spread symmetrically. */
export function itemAngle(index: number, count: number): number {
  return ((index - (count - 1) / 2) * WHEEL_ITEM_SPREAD_DEG * Math.PI) / 180;
}

/** Position of item `index` on the wheel circumference. */
export function itemPosition(
  index: number,
  count: number,
  cx: number,
  cy: number,
  radius: number,
): Point {
  const angle = itemAngle(index, count);
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

/**
 * Clamp the wheel rotation. The usable arc is the item spread plus a little
 * overshoot headroom (E), so spinning hard still lands within the arc.
 */
export function clampRotation(rotation: number, count: number, radius: number): number {
  const arc = ((count - 1) / 2) * WHEEL_ITEM_SPREAD_DEG;
  const overshoot = (100 / radius) * (180 / Math.PI);
  return Math.max(-(arc + overshoot), Math.min(arc, rotation));
}
