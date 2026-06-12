import net from "node:net";
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = process.env.PORT ?? "3000";
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const postgresHost = process.env.POSTGRES_HOST ?? "127.0.0.1";
const postgresPort = Number(process.env.POSTGRES_PORT ?? 5432);

function log(message) {
  console.log(`[dev:all] ${message}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function run(command, options = {}) {
  execSync(command, { cwd: root, stdio: "inherit", ...options });
}

function waitForPort(host, targetPort, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout: ${host}:${targetPort} indisponible`));
        return;
      }

      const socket = net.createConnection({ host, port: targetPort });
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        setTimeout(tryConnect, 1000);
      });
    };
    tryConnect();
  });
}

function killPort(targetPort) {
  if (process.platform !== "win32") {
    try {
      execSync(`lsof -ti:${targetPort} | xargs kill -9 2>/dev/null`, {
        stdio: "ignore",
        shell: true,
      });
    } catch {
      // port free
    }
    return;
  }

  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        // already exited
      }
    }
  } catch {
    // port free
  }
}

function cleanNextCache() {
  const nextDir = path.join(root, ".next");
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      log("Cache .next supprimé");
      return;
    } catch {
      if (attempt < 3) sleep(1000);
    }
  }
}

async function main() {
  log("Démarrage Docker (Postgres + Mailpit)...");
  try {
    run("docker compose up -d");
  } catch {
    console.error(`
[dev:all] Docker n'est pas disponible.

→ Lancez Docker Desktop et attendez "Running"
→ Puis relancez : npm run dev:all

Alternative :
  npm run docker:up   (une fois Docker lancé)
  npm run dev
`);
    process.exit(1);
  }

  log(`Attente PostgreSQL (${postgresHost}:${postgresPort})...`);
  await waitForPort(postgresHost, postgresPort);
  log("PostgreSQL prêt");

  log("Génération client Prisma...");
  run("npm run db:generate");

  killPort(3000);
  killPort(3001);
  sleep(800);
  cleanNextCache();

  log(`Next.js → http://localhost:${port}`);
  log("Mailpit → http://localhost:8025");

  const child = spawn(process.execPath, [nextBin, "dev", "--port", port], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      WATCHPACK_POLLING: "true",
      WATCHPACK_POLLING_INTERVAL: "1000",
      CHOKIDAR_USEPOLLING: "true",
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

main().catch((error) => {
  console.error("[dev:all]", error.message);
  process.exit(1);
});
