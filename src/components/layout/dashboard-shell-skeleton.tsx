import { UserType } from "@prisma/client";
import { BRANDING } from "@/lib/constants";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import DashboardLoading from "@/app/(dashboard)/loading";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDemoMode } from "@/lib/demo-mode";

type DashboardUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function DashboardShellSkeleton({ user }: { user: DashboardUser }) {
  const isVscg = user.type === UserType.internal;
  const headerLogoUrl =
    !isVscg && user.company.logoUrl ? user.company.logoUrl : null;

  return (
    <DashboardShell
      isAdmin={user.permissions.isAdmin}
      showPlanning={user.permissions.isAdmin || user.permissions.isPlanner}
      isParticipantOnly={false}
      demoMode={isDemoMode()}
      userId={user.id}
      userName={`${user.firstName} ${user.lastName}`}
      userEmail={user.email}
      userFirstName={user.firstName}
      userLastName={user.lastName}
      userAvatarUrl={user.avatarUrl}
      organizationName="Value Stream Consulting"
      organizationLogoDarkUrl={BRANDING.DEFAULT_LOGO_DARK}
      headerLogoUrl={headerLogoUrl}
      headerLogoAlt={user.company.name}
      companyOptions={[]}
      activeCompanyId={null}
    >
      <DashboardLoading />
    </DashboardShell>
  );
}
