import { readFileSync, writeFileSync } from "node:fs";

const bumpType = process.argv[2];

if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error("Uso: node scripts/bump-version.mjs <patch|minor|major>");
  process.exit(1);
}

const packagePath = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const current = String(packageJson.version ?? "");
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);

if (!match) {
  console.error(`Versão inválida no package.json: ${current}`);
  process.exit(1);
}

let [, major, minor, patch] = match.map(Number);

if (bumpType === "major") {
  major += 1;
  minor = 0;
  patch = 0;
} else if (bumpType === "minor") {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const nextVersion = `${major}.${minor}.${patch}`;
packageJson.version = nextVersion;
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(nextVersion);
