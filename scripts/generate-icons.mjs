import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../public/icon.svg", import.meta.url));

await sharp(svg).resize(180, 180).png().toFile(new URL("../public/apple-touch-icon.png", import.meta.url));
await sharp(svg).resize(180, 180).png().toFile(new URL("../public/apple-touch-icon-finmonth-v3.png", import.meta.url));
await sharp(svg).resize(192, 192).png().toFile(new URL("../public/icon-192.png", import.meta.url));
await sharp(svg).resize(512, 512).png().toFile(new URL("../public/icon-512.png", import.meta.url));

console.log("FinMonth icons generated from public/icon.svg");
