import { describe, expect, it } from "vitest";
import { createTypewriter, startTyping, typewriterTick } from "@/lib/typewriter";

describe("hero typewriter state machine", () => {
  it("starts waiting with nothing typed", () => {
    const s = createTypewriter(["Graphic Designer", "BASED: Berlin"]);
    expect(s.phase).toBe("waiting");
    expect(s.completed).toEqual([]);
    expect(s.current).toBe("");
    expect(s.index).toBe(0);
  });

  it("ignores ticks while waiting", () => {
    const s = typewriterTick(createTypewriter(["ab"]));
    expect(s.phase).toBe("waiting");
    expect(s.current).toBe("");
  });

  it("types one character per tick", () => {
    let s = startTyping(createTypewriter(["abc"]));
    s = typewriterTick(s);
    expect(s.current).toBe("a");
    s = typewriterTick(s);
    expect(s.current).toBe("ab");
    expect(s.phase).toBe("typing");
  });

  it("moves to pausing when an item is fully typed", () => {
    let s = startTyping(createTypewriter(["ab"]));
    s = typewriterTick(typewriterTick(s));
    expect(s.phase).toBe("pausing");
    expect(s.current).toBe("ab");
  });

  it("commits the item and starts the next after the pause tick", () => {
    let s = startTyping(createTypewriter(["ab", "cd"]));
    s = typewriterTick(typewriterTick(s)); // "ab" complete → pausing
    s = typewriterTick(s); // pause elapses → commit + next item
    expect(s.completed).toEqual(["ab"]);
    expect(s.index).toBe(1);
    expect(s.current).toBe("");
    expect(s.phase).toBe("typing");
  });

  it("finishes after the last item and stays stable", () => {
    let s = startTyping(createTypewriter(["ab", "cd"]));
    // type item 1
    s = typewriterTick(typewriterTick(s));
    s = typewriterTick(s);
    // type item 2
    s = typewriterTick(typewriterTick(s));
    s = typewriterTick(s);
    expect(s.phase).toBe("finished");
    expect(s.completed).toEqual(["ab", "cd"]);
    // further ticks are no-ops
    expect(typewriterTick(s)).toEqual(s);
  });

  it("handles an empty item list without crashing", () => {
    const s = createTypewriter([]);
    expect(startTyping(s).phase).toBe("finished");
  });

  it("handles items with multi-byte characters correctly", () => {
    let s = startTyping(createTypewriter("BASÉ: Berlin".split("|")));
    s = typewriterTick(s);
    expect(s.current).toBe("B");
    s = typewriterTick(s);
    expect(s.current).toBe("BA");
  });
});
