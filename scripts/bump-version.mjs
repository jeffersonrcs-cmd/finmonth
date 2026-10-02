import { readFileSync, writeFileSync } from "node:fs";

const bumpType = process.argv[2];

if (!["patch", "minor", "major", "rev"].includes(bumpType)) {
  console.error("Uso: node scripts/bump-version.mjs <patch|minor|major|rev>");
  process.exit(1);
}

const packagePath = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const current = String(packageJson.version ?? "");
const currentRevision = Number(packageJson.revision ?? 0);
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);

if (!match) {
  console.error(`Versão inválida no package.json: ${current}`);
  process.exit(1);
}

let [, major, minor, patch] = match.map(Number);
let nextRevision = currentRevision;

if (bumpType === "rev") {
  if (!Number.isInteger(currentRevision) || currentRevision < 0) {
    console.error(`Revisão inválida no package.json: ${currentRevision}`);
    process.exit(1);
  }
  nextRevision += 1;
} else if (bumpType === "major") {
  major += 1;
  minor = 0;
  patch = 0;
  nextRevision = 1;
} else if (bumpType === "minor") {
  minor += 1;
  patch = 0;
  nextRevision = 1;
} else {
  patch += 1;
  nextRevision = 1;
}

const nextVersion = `${major}.${minor}.${patch}`;
packageJson.version = nextVersion;
packageJson.revision = nextRevision;
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

const historyPath = new URL("../src/lib/versionHistory.ts", import.meta.url);
const historySource = readFileSync(historyPath, "utf8");

if (bumpType !== "rev" && !historySource.includes(`version: "${nextVersion}"`)) {
  const fallback = {
    patch: {
      pt: "Correções e melhorias para uma experiência mais estável.",
      en: "Fixes and improvements for a more stable experience.",
      es: "Correcciones y mejoras para una experiencia más estable.",
    },
    minor: {
      pt: "Novos recursos e melhorias para facilitar o uso do FinMonth.",
      en: "New features and improvements to make FinMonth easier to use.",
      es: "Nuevas funciones y mejoras para facilitar el uso de FinMonth.",
    },
    major: {
      pt: "Uma nova etapa do FinMonth, com mudanças e melhorias importantes.",
      en: "A new FinMonth milestone with important changes and improvements.",
      es: "Una nueva etapa de FinMonth, con cambios y mejoras importantes.",
    },
  }[bumpType];

  const change = {
    pt: process.env.FINMONTH_RELEASE_PT || fallback.pt,
    en: process.env.FINMONTH_RELEASE_EN || fallback.en,
    es: process.env.FINMONTH_RELEASE_ES || fallback.es,
  };

  const entry = `  {
    version: "${nextVersion}",
    changes: [
      {
        pt: ${JSON.stringify(change.pt)},
        en: ${JSON.stringify(change.en)},
        es: ${JSON.stringify(change.es)},
      },
    ],
  },
`;

  const marker = "export const VERSION_HISTORY: VersionHistoryEntry[] = [";
  const markerIndex = historySource.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("Não foi possível localizar VERSION_HISTORY.");
  }

  const insertAt = markerIndex + marker.length;
  const updatedHistory = historySource.slice(0, insertAt) + "\n" + entry + historySource.slice(insertAt);
  writeFileSync(historyPath, updatedHistory);
}

console.log(bumpType === "rev" ? `${nextVersion} Rev.${nextRevision}` : nextVersion);
