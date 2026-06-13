import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { needsFileWatcherPolling } from "./file-watcher-polling.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = process.env.PORT ?? "3000";
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const cliArgs = process.argv.slice(2);
const useTurbo =
  cliArgs.includes("--turbo") ||
  process.env.DEV_TURBO === "1" ||
  process.env.DEV_TURBO === "true";

function log(message) {
  console.log(`[dev] ${message}`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function killPort(targetPort) {
  if (process.platform !== "win32") {
    try {
      execSync(`lsof -ti:${targetPort} | xargs kill -9 2>/dev/null`, {
        stdio: "ignore",
        shell: true,
      });
    } catch {
      // port already free
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
        log(`Port ${targetPort} libéré (PID ${pid})`);
      } catch {
        // process already exited
      }
    }
  } catch {
    // port already free
  }
}

log("Arrêt des anciens serveurs sur les ports 3000 et 3001...");
killPort(3000);
killPort(3001);
sleep(800);

if (process.env.DEV_CLEAN === "true" || process.env.DEV_CLEAN === "1") {
  log("DEV_CLEAN=1 → nettoyage .next…");
  execSync(`node "${path.join(__dirname, "clean-next.mjs")}"`, {
    stdio: "inherit",
    cwd: root,
  });
} else if (/OneDrive/i.test(root)) {
  log("OneDrive : .next conservé au démarrage (npm run clean:next si corruption)");
}

log(`Démarrage sur http://localhost:${port}`);
if (useTurbo) {
  log("Turbopack activé (--turbo ou DEV_TURBO=1)");
}

const usePolling = needsFileWatcherPolling(root);
if (usePolling) {
  log("File watcher : polling (OneDrive / WEBPACK_POLL=true)");
} else {
  log("File watcher : natif (sans polling)");
}

const devEnv = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
};
if (usePolling) {
  devEnv.WATCHPACK_POLLING = "true";
  devEnv.WATCHPACK_POLLING_INTERVAL = process.env.WEBPACK_POLL_INTERVAL ?? "1000";
  devEnv.CHOKIDAR_USEPOLLING = "true";
}

const child = spawn(process.execPath, [nextBin, "dev", "--port", port, ...(useTurbo ? ["--turbo"] : [])], {
  cwd: root,
  stdio: "inherit",
  env: devEnv,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
