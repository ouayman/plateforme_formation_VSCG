/**
 * Tue les processus Node qui exécutent next dev/build dans ce projet
 * (évite .next verrouillé sur OneDrive → dev bloqué sur "Starting").
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..");

function isNextWorkerCommandLine(commandLine, root) {
  const line = commandLine.toLowerCase();
  const rootLower = root.toLowerCase();
  if (!line.includes(rootLower)) return false;

  return (
    line.includes("next dev") ||
    line.includes("next build") ||
    line.includes('next" build') ||
    line.includes("next/dist/bin/next") ||
    line.includes("next\\dist\\bin\\next") ||
    line.includes("npx-cli.js next") ||
    line.includes("clean-next.mjs")
  );
}

function killPid(pid, log) {
  if (!pid || pid === String(process.pid)) return;
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore", windowsHide: true });
    log(`Processus arrêté (PID ${pid})`);
  } catch {
    // already gone
  }
}

export function killNextWorkers(projectRoot = defaultRoot, log = () => {}) {
  const root = path.resolve(projectRoot);

  if (process.platform === "win32") {
    try {
      const output = execSync(
        'wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv',
        { encoding: "utf8", windowsHide: true },
      );

      for (const rawLine of output.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("Node,")) continue;

        const lastComma = line.lastIndexOf(",");
        if (lastComma <= 0) continue;

        const pid = line.slice(lastComma + 1).trim();
        const commandLine = line.slice(line.indexOf(",") + 1, lastComma);

        if (!/^\d+$/.test(pid)) continue;
        if (!isNextWorkerCommandLine(commandLine, root)) continue;
        killPid(pid, log);
      }
    } catch {
      // wmic unavailable — fallback PowerShell
      const script = `
$root = ${JSON.stringify(root)}
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and ($_.CommandLine -like "*$root*") } |
  Where-Object {
    $_.CommandLine -match 'next[\\\\/]dist[\\\\/]bin[\\\\/]next' -or
    $_.CommandLine -match 'next dev' -or
    $_.CommandLine -match 'next build' -or
    $_.CommandLine -match 'clean-next'
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Output $_.ProcessId
  }
`.trim();

      try {
        const output = execSync(`powershell -NoProfile -Command ${JSON.stringify(script)}`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "ignore"],
        });
        for (const line of output.split(/\r?\n/)) {
          const pid = line.trim();
          if (/^\d+$/.test(pid)) log(`Processus arrêté (PID ${pid})`);
        }
      } catch {
        // no matching processes
      }
    }
    return;
  }

  try {
    execSync(`pkill -f "${root.replace(/"/g, '\\"')}.*next.*(dev|build)" 2>/dev/null || true`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {
    // ignore
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  killNextWorkers(defaultRoot, (msg) => console.log(`[kill-next] ${msg}`));
}
