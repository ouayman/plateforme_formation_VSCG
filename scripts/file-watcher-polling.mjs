/**
 * OneDrive / réseaux synchronisés : le polling évite les hangs du file watcher.
 * Hors OneDrive : watcher natif (plus rapide, moins de CPU).
 *
 * WEBPACK_POLL=true  → force le polling
 * WEBPACK_POLL=false → désactive le polling
 * (défaut)           → polling si le chemin du projet contient "OneDrive"
 */
export function needsFileWatcherPolling(cwd = process.cwd()) {
  if (process.env.WEBPACK_POLL === "true") return true;
  if (process.env.WEBPACK_POLL === "false") return false;
  return /OneDrive/i.test(cwd);
}

export function watchOptionsForDev(cwd = process.cwd()) {
  if (!needsFileWatcherPolling(cwd)) return undefined;

  return {
    poll: Number(process.env.WEBPACK_POLL_INTERVAL ?? 1000),
    aggregateTimeout: 300,
    ignored: ["**/node_modules/**", "**/.git/**", "**/uploads/**"],
  };
}
