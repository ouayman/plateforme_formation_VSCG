import { BRANDING } from "@/lib/constants";
import { resolveMediaUrl } from "@/lib/media-url";

/** URL absolue du logo pour les emails (clients mail externes, ex. Resend). */
export function resolveEmailLogoUrl(
  logoPath: string | null | undefined,
  appUrl: string
): string {
  const path = logoPath?.trim();
  const fallback = BRANDING.DEFAULT_LOGO_LIGHT;

  if (!path) {
    return toAbsoluteMediaUrl(fallback, appUrl);
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return toAbsoluteMediaUrl(path, appUrl);
}

function toAbsoluteMediaUrl(path: string, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  const mediaPath = resolveMediaUrl(path);
  return mediaPath.startsWith("http://") || mediaPath.startsWith("https://")
    ? mediaPath
    : `${base}${mediaPath.startsWith("/") ? mediaPath : `/${mediaPath}`}`;
}
