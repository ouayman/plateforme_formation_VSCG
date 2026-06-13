export {
  getCachedOrganizationName,
  getCachedPlatformSettings,
  invalidatePlatformSettingsCache,
} from "@/lib/cache/platform-settings-cache";

/** @deprecated Utiliser invalidatePlatformSettingsCache */
export { invalidatePlatformSettingsCache as invalidateOrganizationNameCache } from "@/lib/cache/platform-settings-cache";
