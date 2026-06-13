import { UserType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getClientCompanyContext, type ClientCompanyUser } from "@/lib/active-company";
import {
  getCachedPlatformSettings,
  type CachedPlatformSettings,
} from "@/lib/cache/platform-settings-cache";
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

function clientCompanyFromUser(user: DashboardUser) {
  return user.type === UserType.client
    ? getClientCompanyContext(user as ClientCompanyUser)
    : { companyOptions: [] as { id: string; name: string }[], activeCompanyId: null };
}

function mergeContext(
  user: DashboardUser,
  settings: CachedPlatformSettings,
  showPlanning: boolean,
  participantOnly: boolean
): DashboardLayoutContext {
  const clientCompany = clientCompanyFromUser(user);
  return {
    showPlanning,
    participantOnly,
    organizationName: settings.organizationName,
    organizationLogoDarkUrl: settings.logoDarkUrl,
    companyOptions: clientCompany.companyOptions,
    activeCompanyId: clientCompany.activeCompanyId,
  };
}

/** Charge user + settings en parallèle, puis complète le contexte shell (sans bloquer les pages dans un 2e composant async). */
export async function loadDashboardShellData(): Promise<{
  user: DashboardUser | null;
  ctx: DashboardLayoutContext | null;
}> {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getCachedPlatformSettings(),
  ]);

  if (!user) {
    return { user: null, ctx: null };
  }

  const planningFast = resolvePlanningAccessFast(user.permissions);
  const participantFast = resolveParticipantOnlyFast(user.permissions);

  if (planningFast !== null && participantFast !== null) {
    return {
      user,
      ctx: mergeContext(user, settings, planningFast, participantFast),
    };
  }

  const [showPlanning, participantOnly] = await Promise.all([
    planningFast !== null ? planningFast : resolvePlanningAccess(user.id, user.permissions),
    participantFast !== null ? participantFast : isParticipantOnly(user.id, user.permissions),
  ]);

  return {
    user,
    ctx: mergeContext(user, settings, showPlanning, participantOnly),
  };
}

/** @deprecated Préférer loadDashboardShellData() depuis le layout. */
export async function getDashboardLayoutContext(
  user: DashboardUser
): Promise<DashboardLayoutContext> {
  const settings = await getCachedPlatformSettings();
  const planningFast = resolvePlanningAccessFast(user.permissions);
  const participantFast = resolveParticipantOnlyFast(user.permissions);

  const [showPlanning, participantOnly] = await Promise.all([
    planningFast !== null ? planningFast : resolvePlanningAccess(user.id, user.permissions),
    participantFast !== null ? participantFast : isParticipantOnly(user.id, user.permissions),
  ]);

  return mergeContext(user, settings, showPlanning, participantOnly);
}
