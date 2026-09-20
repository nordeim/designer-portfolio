// Computed-style extraction DIFF (pairs with scripts/extract-styles.js).
//
//   agent-browser eval "$(cat scripts/extract-styles.js)" > target.json   # on the reference
//   agent-browser eval "$(cat scripts/extract-styles.js)" > local.json    # on this clone
//   node scripts/diff-styles.js target.json local.json
//
// Known extraction artifacts (documented in PAD §10 Known Issues):
//   1. marquee.animation — animation shorthand measured on a wrapper span
//      (animation-name is "none" on both sides; duration differs by wrapper).
//   2. particle* border-radius — authored 9999px vs the browser's computed
//      2^25px (33554432px). Identical rendering (both are "fully round").
//   3. font-family Fallback strings — Next 16.3+ appends metric-compatible
//      local fallbacks ("Inter Fallback") to the computed font-family stack;
//      rendered glyphs are unchanged (pixel-diff verified, session 8).
import { readFileSync } from "node:fs";

const [targetPath, localPath] = process.argv.slice(2);
if (!targetPath || !localPath) {
  console.error("usage: node scripts/diff-styles.js <target.json> <local.json>");
  process.exit(2);
}

// extract-styles.js emits a JSON string; eval output is that string, so the
// file content is a JSON-encoded JSON string — parse twice.
const load = (p) => JSON.parse(JSON.parse(readFileSync(p, "utf8")));
const target = load(targetPath);
const local = load(localPath);

const ARTIFACTS = [
  (section, key) => section === "marquee" && key === "animation",
  (section, key) => /^particle/.test(section) && key === "border-radius",
  // Next.js 16.3+ metric-compatible local fallbacks in computed font-family.
  (section, key, tv, lv) => key === "font-family" && /Fallback/.test(tv + lv),
];

let diffs = 0;
let artifactDiffs = 0;
const sections = new Set([...Object.keys(target), ...Object.keys(local)]);
for (const section of sections) {
  const t = target[section] ?? {};
  const l = local[section] ?? {};
  if (t == null || l == null || typeof t !== "object" || typeof l !== "object") {
    if (JSON.stringify(t) !== JSON.stringify(l)) {
      console.log(
        `[${section}] presence differs: target=${JSON.stringify(t)?.slice(0, 50)} local=${JSON.stringify(l)?.slice(0, 50)}`,
      );
      diffs++;
    }
    continue;
  }
  const keys = new Set([...Object.keys(t), ...Object.keys(l)]);
  for (const key of keys) {
    if (key.startsWith("_")) continue; // _text/_tag are extraction metadata
    const tv = String(t[key] ?? "");
    const lv = String(l[key] ?? "");
    if (tv === lv) continue;
    if (ARTIFACTS.some((isArtifact) => isArtifact(section, key, tv, lv))) {
      artifactDiffs++;
      console.log(`[artifact] ${section}.${key}: target="${tv}" local="${lv}"`);
    } else {
      diffs++;
      console.log(`[DIFF] ${section}.${key}: target="${tv}" local="${lv}"`);
    }
  }
}
console.log(`\n${diffs} real diff(s), ${artifactDiffs} known artifact(s)`);
process.exit(diffs === 0 ? 0 : 1);
