import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";
import { getActiveCompanyId, getUserCompanyOptions } from "@/lib/active-company";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessPlanning, isParticipantOnly } from "@/lib/permissions";
import { isDemoMode } from "@/lib/demo-mode";
import { getPlatformSettings } from "@/lib/platform-settings";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [showPlanning, settings, participantOnly, companyOptions, activeCompanyId] =
    await Promise.all([
    canAccessPlanning(user.id),
    getPlatformSettings(),
    isParticipantOnly(user.id),
    user.type === UserType.client ? getUserCompanyOptions(user.id) : Promise.resolve([]),
    user.type === UserType.client ? getActiveCompanyId(user.id) : Promise.resolve(null),
  ]);

  const userName = `${user.firstName} ${user.lastName}`;
  const isVscg = user.type === UserType.internal;
  const headerLogoUrl =
    !isVscg && user.company.logoUrl ? user.company.logoUrl : null;
  const headerLogoAlt = user.company.name;

  return (
    <DashboardShell
      isAdmin={user.permissions.isAdmin}
      showPlanning={showPlanning}
      isParticipantOnly={participantOnly}
      demoMode={isDemoMode()}
      userId={user.id}
      userName={userName}
      userEmail={user.email}
      userFirstName={user.firstName}
      userLastName={user.lastName}
      userAvatarUrl={user.avatarUrl}
      organizationName={settings.organizationName}
      organizationLogoDarkUrl={settings.logoDarkUrl}
      headerLogoUrl={headerLogoUrl}
      headerLogoAlt={headerLogoAlt}
      companyOptions={companyOptions}
      activeCompanyId={activeCompanyId}
    >
      {children}
    </DashboardShell>
  );
}
