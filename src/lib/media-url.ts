export function resolveMediaUrl(
  path: string | null | undefined,
  cacheVersion?: number | string
): string {
  if (!path) return "";
  let url: string;
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) {
    url = path;
  } else {
    url = `/api/media/${path}`;
  }
  if (cacheVersion !== undefined && cacheVersion !== "") {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}v=${encodeURIComponent(String(cacheVersion))}`;
  }
  return url;
}
