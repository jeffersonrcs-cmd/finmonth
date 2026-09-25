import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../public/icon.svg", import.meta.url));
const outputPath = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

await sharp(svg).resize(180, 180).png().toFile(outputPath("apple-touch-icon.png"));
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(outputPath("apple-touch-icon-finmonth-v3.png"));
await sharp(svg).resize(192, 192).png().toFile(outputPath("icon-192.png"));
await sharp(svg).resize(512, 512).png().toFile(outputPath("icon-512.png"));

console.log("FinMonth icons generated from public/icon.svg");
