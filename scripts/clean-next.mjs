#!/usr/bin/env node
/**
 * Supprime .next (corruption OneDrive / dev+build concurrents).
 * Usage: node scripts/clean-next.mjs [--kill-ports]
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { killNextWorkers } from "./kill-next-workers.mjs";
import { removeNextDir } from "./next-dir-cleanup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const killPorts = process.argv.includes("--kill-ports");

function log(msg) {
  console.log(`[clean:next] ${msg}`);
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
      // free
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
        // gone
      }
    }
  } catch {
    // free
  }
}

if (killPorts) {
  killPort(3000);
  killPort(3001);
  sleep(600);
}

killNextWorkers(root, (msg) => log(msg));
sleep(400);

if (/OneDrive/i.test(root)) {
  log("OneDrive : quarantaine .next (rename rapide, pas de parcours récursif)");
}

if (!removeNextDir(root, log)) {
  console.error("[clean:next] npm run dev:stop && npm run clean:next");
  process.exit(1);
}

log(".next supprimé");
