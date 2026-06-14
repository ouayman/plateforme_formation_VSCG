/**
 * Nettoyage .next compatible OneDrive : rename instantané + suppression async.
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function getNextDir(root) {
  return path.join(path.resolve(root), ".next");
}

function scheduleBackgroundDelete(targetPath) {
  if (process.platform === "win32") {
    spawn("cmd.exe", ["/c", "rmdir", "/s", "/q", targetPath], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    return;
  }

  spawn("rm", ["-rf", targetPath], {
    detached: true,
    stdio: "ignore",
  }).unref();
}

/**
 * Déplace .next hors du projet (rapide sur OneDrive) puis supprime en arrière-plan.
 */
export function quarantineNextDir(root, log = () => {}) {
  const nextDir = getNextDir(root);
  if (!fs.existsSync(nextDir)) return true;

  const trashName = `.next.trash.${Date.now()}`;
  const trashPath = path.join(path.resolve(root), trashName);

  try {
    fs.renameSync(nextDir, trashPath);
    log(`.next déplacé → ${trashName} (suppression en arrière-plan)`);
    scheduleBackgroundDelete(trashPath);
    return true;
  } catch (err) {
    log(`Rename impossible — ${err.code ?? err.message}`);
    return false;
  }
}

/**
 * Supprime .next — quarantaine immédiate sur OneDrive, sinon rmdir Windows / rmSync.
 */
export function removeNextDir(root, log = () => {}) {
  const nextDir = getNextDir(root);
  if (!fs.existsSync(nextDir)) return true;

  if (/OneDrive/i.test(path.resolve(root))) {
    return quarantineNextDir(root, log);
  }

  if (process.platform === "win32") {
    try {
      execSync(`cmd.exe /c rmdir /s /q "${nextDir}"`, { stdio: "ignore" });
      if (!fs.existsSync(nextDir)) return true;
    } catch (err) {
      log(`rmdir échoué — ${err.message}`);
    }
    return quarantineNextDir(root, log);
  }

  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
    return true;
  } catch (err) {
    log(`rmSync échoué — ${err.message}`);
    return quarantineNextDir(root, log);
  }
}
