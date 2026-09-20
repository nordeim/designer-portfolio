/**
 * Pure state machine for the hero's typewriter effect. The reference app
 * types each meta line ("Graphic Designer" / "BASED: Berlin" /
 * "hello@alexmoreau.design") character by character with a trailing "|"
 * cursor and a short pause between items. Extracted as pure functions so
 * the sequencing is unit-testable; components own only the timers.
 *
 * Phases: waiting → typing → (pausing → typing)* → finished.
 * A tick during "typing" reveals one more character of the current item;
 * a tick during "pausing" (i.e. after the pause elapsed) commits the item
 * and moves to the next one (or finishes).
 */

export interface TypewriterState {
  readonly items: readonly string[];
  readonly completed: readonly string[];
  readonly current: string;
  readonly index: number;
  readonly phase: "waiting" | "typing" | "pausing" | "finished";
}

export function createTypewriter(items: readonly string[]): TypewriterState {
  return {
    items,
    completed: [],
    current: "",
    index: 0,
    phase: items.length === 0 ? "finished" : "waiting",
  };
}

export function startTyping(state: TypewriterState): TypewriterState {
  if (state.phase !== "waiting") return state;
  return { ...state, phase: "typing" };
}

export function typewriterTick(state: TypewriterState): TypewriterState {
  switch (state.phase) {
    case "waiting":
    case "finished":
      return state;
    case "pausing": {
      // The pause has elapsed: commit the item and advance.
      const completed = [...state.completed, state.items[state.index]];
      const nextIndex = state.index + 1;
      if (nextIndex >= state.items.length) {
        return { ...state, completed, current: "", phase: "finished" };
      }
      return { ...state, completed, index: nextIndex, current: "", phase: "typing" };
    }
    case "typing": {
      const target = state.items[state.index] ?? "";
      const next = target.slice(0, state.current.length + 1);
      // Typing the final character of the item moves straight into the
      // pause — no extra "check" tick needed.
      return { ...state, current: next, phase: next.length >= target.length ? "pausing" : "typing" };
    }
  }
}
