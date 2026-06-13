import { UserType } from "@prisma/client";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import { getClientCompanyContext, type ClientCompanyUser } from "@/lib/active-company";
import { getCachedPlatformSettings } from "@/lib/cache/platform-settings-cache";
import {
  isParticipantOnly,
  resolveParticipantOnlyFast,
  resolvePlanningAccess,
  resolvePlanningAccessFast,
} from "@/lib/permissions";

type DashboardUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type DashboardLayoutContext = {
  showPlanning: boolean;
  participantOnly: boolean;
  organizationName: string;
  organizationLogoDarkUrl: string;
  companyOptions: { id: string; name: string }[];
  activeCompanyId: string | null;
};

export async function getDashboardLayoutContext(
  user: DashboardUser
): Promise<DashboardLayoutContext> {
  const planningFast = resolvePlanningAccessFast(user.permissions);
  const participantFast = resolveParticipantOnlyFast(user.permissions);

  const clientCompany =
    user.type === UserType.client
      ? getClientCompanyContext(user as ClientCompanyUser)
      : { companyOptions: [] as { id: string; name: string }[], activeCompanyId: null };

  const [showPlanning, settings, participantOnly] = await Promise.all([
    planningFast !== null
      ? planningFast
      : resolvePlanningAccess(user.id, user.permissions),
    getCachedPlatformSettings(),
    participantFast !== null
      ? participantFast
      : isParticipantOnly(user.id, user.permissions),
  ]);

  return {
    showPlanning,
    participantOnly,
    organizationName: settings.organizationName,
    organizationLogoDarkUrl: settings.logoDarkUrl,
    companyOptions: clientCompany.companyOptions,
    activeCompanyId: clientCompany.activeCompanyId,
  };
}
