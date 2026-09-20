/**
 * Optimize downloaded portfolio images for web + git.
 * - Resize to max 2000px on the long edge.
 * - Photos stored as PNG become JPEG (portfolio photography; no alpha needed).
 * - Small images are left untouched when already reasonable.
 */
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = "/home/z/my-project/public/projects";
const MAX_EDGE = 2000;
const PNG_JPEG_THRESHOLD = 400 * 1024; // PNGs above 400KB become JPEG

async function processDir(dir) {
  const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  for (const file of files) {
    const full = path.join(dir, file);
    const before = (await stat(full)).size;
    const img = sharp(full, { failOn: "none" });
    const meta = await img.metadata();
    const isPng = /\.png$/i.test(file);

    let pipeline = sharp(full, { failOn: "none" }).rotate();
    if (Math.max(meta.width || 0, meta.height || 0) > MAX_EDGE) {
      pipeline = pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
    }

    let outPath = full;
    if (isPng && before > PNG_JPEG_THRESHOLD) {
      outPath = full.replace(/\.png$/i, ".jpg");
      await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(outPath + ".tmp");
      await rm(full, { force: true });
    } else if (isPng) {
      await pipeline.png({ compressionLevel: 9, quality: 90 }).toFile(full + ".tmp");
    } else {
      await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(full + ".tmp");
    }
    await rm(outPath, { force: true });
    await (await import("node:fs/promises")).rename(outPath + ".tmp", outPath);
    const after = (await stat(outPath)).size;
    console.log(`${path.relative(ROOT, outPath)}: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024).toFixed(0)}KB`);
  }
}

const dirs = (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => path.join(ROOT, d.name));
for (const dir of dirs) await processDir(dir);
console.log("done");
