import { CompanyType } from "@prisma/client";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { safeDeleteStoredFile } from "@/lib/uploads";
import { BRANDING } from "@/lib/constants";
import { invalidatePlatformSettingsCache } from "@/lib/cache/platform-settings-cache";

export type PlatformSettingsData = {
  organizationName: string;
  logoDarkUrl: string;
  logoLightUrl: string;
  logoEmailUrl: string | null;
  welcomeSignatory: string;
};

const DEFAULT_SETTINGS: PlatformSettingsData = {
  organizationName: "Value Stream Consulting",
  logoDarkUrl: BRANDING.DEFAULT_LOGO_DARK,
  logoLightUrl: BRANDING.DEFAULT_LOGO_LIGHT,
  logoEmailUrl: null,
  welcomeSignatory: "L'équipe VSCG",
};

const loadPlatformSettingsFromDb = unstable_cache(
  async (): Promise<PlatformSettingsData> => {
    const row = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    if (!row) return DEFAULT_SETTINGS;
    return {
      organizationName: row.organizationName,
      logoDarkUrl: row.logoDarkUrl || DEFAULT_SETTINGS.logoDarkUrl,
      logoLightUrl: row.logoLightUrl || DEFAULT_SETTINGS.logoLightUrl,
      logoEmailUrl: row.logoEmailUrl,
      welcomeSignatory: row.welcomeSignatory || DEFAULT_SETTINGS.welcomeSignatory,
    };
  },
  ["platform-settings"],
  { revalidate: 60, tags: ["platform-settings"] }
);

export const getPlatformSettings = cache(async (): Promise<PlatformSettingsData> => {
  return loadPlatformSettingsFromDb();
});

export async function getInternalCompany() {
  return prisma.company.findFirst({
    where: { type: CompanyType.internal },
  });
}

export async function ensurePlatformBootstrap() {
  const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  let internal = await getInternalCompany();

  if (!internal) {
    internal = await prisma.company.create({
      data: {
        id: "seed-internal",
        name: DEFAULT_SETTINGS.organizationName,
        type: CompanyType.internal,
        logoUrl: DEFAULT_SETTINGS.logoDarkUrl,
      },
    });
  }

  if (!settings) {
    await prisma.platformSettings.create({
      data: {
        id: "default",
        organizationName: internal.name,
        logoDarkUrl: internal.logoUrl ?? DEFAULT_SETTINGS.logoDarkUrl,
        logoLightUrl: DEFAULT_SETTINGS.logoLightUrl,
        logoEmailUrl: null,
        welcomeSignatory: DEFAULT_SETTINGS.welcomeSignatory,
      },
    });
  }

  return { settings: await getPlatformSettings(), internalCompany: internal };
}

export async function updatePlatformSettings(data: PlatformSettingsData) {
  const internal = await getInternalCompany();
  if (internal) {
    await prisma.company.update({
      where: { id: internal.id },
      data: {
        name: data.organizationName,
        logoUrl: data.logoDarkUrl,
      },
    });
  }

  return prisma.platformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      organizationName: data.organizationName,
      logoDarkUrl: data.logoDarkUrl,
      logoLightUrl: data.logoLightUrl,
      logoEmailUrl: data.logoEmailUrl,
      welcomeSignatory: data.welcomeSignatory,
    },
    update: {
      organizationName: data.organizationName,
      logoDarkUrl: data.logoDarkUrl,
      logoLightUrl: data.logoLightUrl,
      logoEmailUrl: data.logoEmailUrl,
      welcomeSignatory: data.welcomeSignatory,
    },
  }).then((result) => {
    revalidateTag("platform-settings");
    invalidatePlatformSettingsCache();
    return result;
  });
}

export async function updatePlatformBrandImage(
  kind: "dark" | "light" | "email",
  storedPath: string
): Promise<PlatformSettingsData> {
  const current = await getPlatformSettings();
  const previousPath =
    kind === "dark"
      ? current.logoDarkUrl
      : kind === "light"
        ? current.logoLightUrl
        : current.logoEmailUrl;
  const next =
    kind === "dark"
      ? { ...current, logoDarkUrl: storedPath }
      : kind === "light"
        ? { ...current, logoLightUrl: storedPath }
        : { ...current, logoEmailUrl: storedPath };
  await updatePlatformSettings(next);
  if (previousPath && previousPath !== storedPath) {
    await safeDeleteStoredFile(previousPath);
  }
  revalidateTag("platform-settings");
  return next;
}
