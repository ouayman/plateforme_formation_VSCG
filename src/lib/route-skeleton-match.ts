export type SkeletonRouteKey =
  | "projects-list"
  | "project-detail"
  | "program-detail"
  | "training-feed"
  | "my-trainings"
  | "planning";

export function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function getSkeletonRouteKey(pathname: string): SkeletonRouteKey | null {
  const path = normalizePath(pathname);

  if (path === "/projects") return "projects-list";
  if (/^\/projects\/[^/]+\/programs\/[^/]+$/.test(path)) return "program-detail";
  if (/^\/projects\/[^/]+$/.test(path)) return "project-detail";
  if (/^\/trainings\/[^/]+$/.test(path)) return "training-feed";
  if (path === "/my-trainings" || path === "/mes-formations") return "my-trainings";
  if (path === "/planning") return "planning";

  return null;
}

export function resolveInternalPath(href: string) {
  if (!href || href.startsWith("#")) return null;

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return normalizePath(url.pathname);
  } catch {
    return null;
  }
}

export function isInternalNavigation(href: string, pathname: string) {
  const targetPath = resolveInternalPath(href);
  if (!targetPath) return false;
  return targetPath !== normalizePath(pathname);
}
