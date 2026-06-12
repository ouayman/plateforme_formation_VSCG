import { execSync } from "node:child_process";

function log(message) {
  console.log(`[dev:stop] ${message}`);
}

function killPort(targetPort) {
  if (process.platform !== "win32") {
    try {
      execSync(`lsof -ti:${targetPort} | xargs kill -9 2>/dev/null`, {
        stdio: "ignore",
        shell: true,
      });
      log(`Port ${targetPort} libéré`);
    } catch {
      log(`Port ${targetPort} déjà libre`);
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

    if (pids.size === 0) {
      log(`Port ${targetPort} déjà libre`);
      return;
    }

    for (const pid of pids) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      log(`Port ${targetPort} libéré (PID ${pid})`);
    }
  } catch {
    log(`Port ${targetPort} déjà libre`);
  }
}

killPort(3000);
killPort(3001);
log("Terminé");
