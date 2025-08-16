import fs from "fs";
import path from "path";
import sharp from "sharp";

const projectRoot = path.resolve(process.cwd());
const srcSvg = path.join(projectRoot, "public", "icons", "shiftpal.svg");
const outDir = path.join(projectRoot, "public", "icons");

const sizes = [192, 256, 384, 512];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generate() {
  await ensureDir(outDir);
  if (!fs.existsSync(srcSvg)) {
    console.warn(
      `[icons] Source SVG not found at ${srcSvg}. Skipping icon generation.`
    );
    return;
  }
  for (const size of sizes) {
    const out = path.join(outDir, `icon-${size}.png`);
    await sharp(srcSvg)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`[icons] Wrote ${out}`);
  }
  // Maskable: export 512 with padding (handled by resize cover keeps edges)
  const maskable = path.join(outDir, "maskable-512.png");
  await sharp(srcSvg)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(maskable);
  console.log(`[icons] Wrote ${maskable}`);
}

generate().catch((err) => {
  console.error("[icons] Failed to generate icons:", err);
  process.exit(1);
});
