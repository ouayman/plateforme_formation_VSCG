import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { resolveEmailLogoUrl } from "@/lib/email-logo-url";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function getEmailBranding(req?: Pick<Request, "headers">) {
  const appUrl = getAppUrl(req);
  const settings = await getPlatformSettings();
  const logoPath = settings.logoEmailUrl || settings.logoLightUrl;

  return {
    appUrl,
    organizationName: settings.organizationName,
    logoUrl: resolveEmailLogoUrl(logoPath, appUrl),
  };
}
