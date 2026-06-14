import { UserType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getClientCompanyContext, type ClientCompanyUser } from "@/lib/active-company";
import {
  getCachedPlatformSettings,
  type CachedPlatformSettings,
} from "@/lib/cache/platform-settings-cache";
import {
  isParticipantOnly,
  canManageClientCompany,
  resolveParticipantOnlyFast,
  resolvePlanningAccess,
  resolvePlanningAccessFast,
} from "@/lib/permissions";

type DashboardUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type DashboardLayoutContext = {
  showPlanning: boolean;
  participantOnly: boolean;
  canManageClientCompany: boolean;
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
  participantOnly: boolean,
  canManageClientCompany: boolean
): DashboardLayoutContext {
  const clientCompany = clientCompanyFromUser(user);
  return {
    showPlanning,
    participantOnly,
    canManageClientCompany,
    organizationName: settings.organizationName,
    organizationLogoDarkUrl: settings.logoDarkUrl,
    companyOptions: clientCompany.companyOptions,
    activeCompanyId: clientCompany.activeCompanyId,
  };
}

async function resolveCanManageClientCompany(
  user: DashboardUser,
  activeCompanyId: string | null
) {
  if (!activeCompanyId) return false;
  return canManageClientCompany(user.id, activeCompanyId, user.permissions);
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

  const clientCompany = clientCompanyFromUser(user);

  if (planningFast !== null && participantFast !== null) {
    const canManageCompany = await resolveCanManageClientCompany(
      user,
      clientCompany.activeCompanyId
    );
    return {
      user,
      ctx: mergeContext(
        user,
        settings,
        planningFast,
        participantFast,
        canManageCompany
      ),
    };
  }

  const [showPlanning, participantOnly, canManageCompany] = await Promise.all([
    planningFast !== null ? planningFast : resolvePlanningAccess(user.id, user.permissions),
    participantFast !== null ? participantFast : isParticipantOnly(user.id, user.permissions),
    resolveCanManageClientCompany(user, clientCompany.activeCompanyId),
  ]);

  return {
    user,
    ctx: mergeContext(user, settings, showPlanning, participantOnly, canManageCompany),
  };
}
