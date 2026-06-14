import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "favicon.png");
const targets = [
  path.join(root, "public", "favicon.ico"),
  path.join(root, "src", "app", "favicon.ico"),
];

if (!fs.existsSync(source)) {
  console.error("Missing public/favicon.png — place the source PNG before running this script.");
  process.exit(1);
}

const metadata = await sharp(source).metadata();
const canvas = Math.max(metadata.width ?? 0, metadata.height ?? 0);
const sizes = [16, 32, 48, 64, 128, 256];

const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(source)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
  )
);

const buffer = await pngToIco(pngBuffers);
for (const target of targets) {
  fs.writeFileSync(target, buffer);
}

fs.unlinkSync(source);

console.log(
  `Favicon generated (${buffer.length} bytes, ${canvas}px source) → public/favicon.ico, src/app/favicon.ico`
);
