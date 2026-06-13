#!/usr/bin/env node
/**
 * Supprime .next (corruption OneDrive / dev+build concurrents).
 * Usage: node scripts/clean-next.mjs [--kill-ports]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nextDir = path.join(root, ".next");
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

function removeEntry(entryPath) {
  const stat = fs.lstatSync(entryPath);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(entryPath)) {
      removeEntry(path.join(entryPath, name));
    }
    fs.rmdirSync(entryPath);
    return;
  }
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(entryPath);
    return;
  }
  fs.unlinkSync(entryPath);
}

function removeNextDir() {
  if (!fs.existsSync(nextDir)) return true;

  const stat = fs.lstatSync(nextDir);
  if (stat.isSymbolicLink()) {
    try {
      fs.unlinkSync(nextDir);
      log("Junction .next legacy supprimée");
      return true;
    } catch (err) {
      log(`Échec junction — ${err.message}`);
      return false;
    }
  }

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      removeEntry(nextDir);
      return true;
    } catch {
      try {
        fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
        return true;
      } catch (err) {
        if (attempt < 6) {
          log(`Verrouillé (${attempt}/6), retry… — ${err.code ?? err.message}`);
          sleep(1000);
        } else {
          log(`Échec suppression .next — ${err.message}`);
          return false;
        }
      }
    }
  }
  return false;
}

if (killPorts) {
  killPort(3000);
  killPort(3001);
  sleep(600);
}

if (/OneDrive/i.test(root)) {
  log("OneDrive : arrête npm run dev avant build (évite EPERM/EINVAL sur .next)");
}

if (!removeNextDir()) {
  console.error("[clean:next] npm run dev:stop && npm run clean:next");
  process.exit(1);
}

log(".next supprimé");
