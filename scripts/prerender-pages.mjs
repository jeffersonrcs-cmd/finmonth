import { spawn } from "node:child_process";
import http from "node:http";
import { writeFileSync } from "node:fs";

console.log("Iniciando servidor para gerar index.html e 404.html estáticos...");

const server = spawn("node", [".output/server/index.mjs"], {
  env: { ...process.env, PORT: "3000", HOST: "127.0.0.1", NODE_ENV: "production" },
  stdio: ["ignore", "inherit", "inherit"],
});

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error("Timeout ao conectar ao servidor local"));
    });
  });
}

// Tenta conectar repetidamente até o servidor estar pronto (até 15 segundos)
async function waitForServerAndFetch() {
  const maxAttempts = 15;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetchUrl("http://127.0.0.1:3000/");
      if (res.status === 200 && res.body.length > 500) {
        return res.body;
      }
    } catch (e) {
      console.log(`Tentativa ${attempt}/${maxAttempts}: servidor ainda inicializando...`);
    }
  }
  throw new Error("Servidor não respondeu dentro do tempo limite.");
}

try {
  const html = await waitForServerAndFetch();
  writeFileSync(".output/public/index.html", html, "utf8");
  writeFileSync(".output/public/404.html", html, "utf8");
  console.log("✓ index.html e 404.html gerados com sucesso para GitHub Pages!");
} catch (err) {
  console.error("Erro ao gerar páginas estáticas:", err);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
