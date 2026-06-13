import { UserType } from "@prisma/client";
import { getDashboardLayoutContext } from "@/lib/dashboard-layout-context";
import type { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDemoMode } from "@/lib/demo-mode";
import { DashboardShell } from "@/components/layout/dashboard-shell";

type DashboardUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function DashboardShellLoaded({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  const ctx = await getDashboardLayoutContext(user);
  const isVscg = user.type === UserType.internal;
  const headerLogoUrl =
    !isVscg && user.company.logoUrl ? user.company.logoUrl : null;

  return (
    <DashboardShell
      isAdmin={user.permissions.isAdmin}
      showPlanning={ctx.showPlanning}
      isParticipantOnly={ctx.participantOnly}
      demoMode={isDemoMode()}
      userId={user.id}
      userName={`${user.firstName} ${user.lastName}`}
      userEmail={user.email}
      userFirstName={user.firstName}
      userLastName={user.lastName}
      userAvatarUrl={user.avatarUrl}
      organizationName={ctx.organizationName}
      organizationLogoDarkUrl={ctx.organizationLogoDarkUrl}
      headerLogoUrl={headerLogoUrl}
      headerLogoAlt={user.company.name}
      companyOptions={ctx.companyOptions}
      activeCompanyId={ctx.activeCompanyId}
    >
      {children}
    </DashboardShell>
  );
}
