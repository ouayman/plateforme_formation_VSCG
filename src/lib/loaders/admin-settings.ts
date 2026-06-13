import "server-only";

import { getPlatformSettings } from "@/lib/platform-settings";

export async function loadAdminSettingsPageData() {
  return getPlatformSettings();
}
