import { readFileSync, writeFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = String(packageJson.version ?? "");
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Versão inválida no package.json: ${version}`);
}

const historyUrl = new URL("../src/lib/versionHistory.ts", import.meta.url);
const history = readFileSync(historyUrl, "utf8");

if (history.includes(`version: "${version}"`)) {
  console.log(`Histórico já contém v${version}.`);
  process.exit(0);
}

const entry = `  {
    version: "${version}",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },
`;

const marker = "export const VERSION_HISTORY: VersionHistoryEntry[] = [";
const markerIndex = history.indexOf(marker);
if (markerIndex === -1) {
  throw new Error("Não foi possível localizar VERSION_HISTORY.");
}

const insertAt = markerIndex + marker.length;
writeFileSync(historyUrl, history.slice(0, insertAt) + "\n" + entry + history.slice(insertAt));
console.log(`Histórico atualizado para v${version}.`);
