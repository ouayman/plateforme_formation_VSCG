import "server-only";

import { prisma } from "@/lib/prisma";
import { BRANDING } from "@/lib/constants";

export type CachedPlatformSettings = {
  organizationName: string;
  logoDarkUrl: string;
  logoLightUrl: string;
  logoEmailUrl: string | null;
  welcomeSignatory: string;
};

const DEFAULT_SETTINGS: CachedPlatformSettings = {
  organizationName: "Value Stream Consulting",
  logoDarkUrl: BRANDING.DEFAULT_LOGO_DARK,
  logoLightUrl: BRANDING.DEFAULT_LOGO_LIGHT,
  logoEmailUrl: null,
  welcomeSignatory: "L'équipe VSCG",
};

const TTL_MS = 60_000;

let cache: { value: CachedPlatformSettings; expiresAt: number } | null = null;

export async function getCachedPlatformSettings(): Promise<CachedPlatformSettings> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const row = await prisma.platformSettings.findUnique({
    where: { id: "default" },
    select: {
      organizationName: true,
      logoDarkUrl: true,
      logoLightUrl: true,
      logoEmailUrl: true,
      welcomeSignatory: true,
    },
  });

  const value: CachedPlatformSettings = row
    ? {
        organizationName: row.organizationName,
        logoDarkUrl: row.logoDarkUrl || DEFAULT_SETTINGS.logoDarkUrl,
        logoLightUrl: row.logoLightUrl || DEFAULT_SETTINGS.logoLightUrl,
        logoEmailUrl: row.logoEmailUrl,
        welcomeSignatory: row.welcomeSignatory || DEFAULT_SETTINGS.welcomeSignatory,
      }
    : DEFAULT_SETTINGS;

  cache = { value, expiresAt: now + TTL_MS };
  return value;
}

export async function getCachedOrganizationName(): Promise<string> {
  const settings = await getCachedPlatformSettings();
  return settings.organizationName;
}

export function invalidatePlatformSettingsCache() {
  cache = null;
}
