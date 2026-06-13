import { ProjectRole, UserType } from "@prisma/client";
import { getActiveCompanyId, getUserCompanyOptions } from "@/lib/active-company";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  isParticipantOnly,
  resolveParticipantOnlyFast,
  resolvePlanningAccess,
  resolvePlanningAccessFast,
} from "@/lib/permissions";
import { getPlatformSettings } from "@/lib/platform-settings";

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

  const [showPlanning, settings, participantOnly, companyOptions, activeCompanyId] =
    await Promise.all([
      planningFast !== null
        ? planningFast
        : resolvePlanningAccess(user.id, user.permissions),
      getPlatformSettings(),
      participantFast !== null
        ? participantFast
        : isParticipantOnly(user.id, user.permissions),
      user.type === UserType.client ? getUserCompanyOptions(user.id) : [],
      user.type === UserType.client ? getActiveCompanyId(user.id) : null,
    ]);

  return {
    showPlanning,
    participantOnly,
    organizationName: settings.organizationName,
    organizationLogoDarkUrl: settings.logoDarkUrl,
    companyOptions,
    activeCompanyId,
  };
}
